import { test, expect, Page, Route } from "@playwright/test";

/**
 * Creates a mock SSE stream response with the given events.
 * Each event is formatted as "event: <type>\ndata: <json>\n\n".
 */
function createMockSSEStream(events: Array<{ type: string; data: Record<string, unknown>; delay?: number }>) {
  return async (route: Route) => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for (const event of events) {
          if (event.delay) {
            await new Promise((r) => setTimeout(r, event.delay));
          }
          const sseText = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
          controller.enqueue(encoder.encode(sseText));
        }
        controller.close();
      },
    });

    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
      body: stream,
    });
  };
}

/**
 * Mock the auth and conversations APIs to allow the page to load.
 */
async function mockAuthAndConversations(page: Page) {
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          userId: "test-user",
          name: "Test User",
          email: "test@example.com",
          avatar: "",
          organisationName: "Test Org",
          organisations: [
            {
              organisationId: "test-org",
              name: "Test Org",
              role: "owner",
            },
          ],
          onboardingCompleted: true,
        },
      }),
    });
  });

  await page.route("**/api/intelligence/conversations", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, conversations: [] }),
      });
    } else {
      await route.continue();
    }
  });

  await page.route("**/api/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
}

test.describe("Streaming Chat Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthAndConversations(page);
  });

  test("renders progressive tokens from SSE stream", async ({ page }) => {
    const events = [
      { type: "run.started", data: { runId: "run-1", conversationId: "conv-1" } },
      { type: "step", data: { id: "s1", name: "understanding", status: "started", label: "Understanding question" }, delay: 50 },
      { type: "step", data: { id: "s1", name: "understanding", status: "done", label: "Understanding question" }, delay: 50 },
      { type: "step", data: { id: "s2", name: "generating", status: "started", label: "Generating answer" }, delay: 50 },
      { type: "token", data: { text: "Hello " }, delay: 50 },
      { type: "token", data: { text: "world! " }, delay: 50 },
      { type: "token", data: { text: "This is " }, delay: 50 },
      { type: "token", data: { text: "a streaming " }, delay: 50 },
      { type: "token", data: { text: "response." }, delay: 50 },
      { type: "step", data: { id: "s2", name: "generating", status: "done", label: "Generating answer" }, delay: 50 },
      { type: "run.completed", data: { mode: "answered", latencyMs: 500 }, delay: 50 },
    ];

    await page.route("**/api/intelligence/chat/stream", createMockSSEStream(events));

    await page.goto("/intelligence");
    await page.waitForLoadState("networkidle");

    const textarea = page.locator("textarea");
    await textarea.fill("Test message");
    await textarea.press("Enter");

    // Wait for streaming to complete and verify final content
    await expect(page.locator("text=Hello world! This is a streaming response.")).toBeVisible({ timeout: 10000 });
  });

  test("displays live step indicator during streaming", async ({ page }) => {
    const events = [
      { type: "run.started", data: { runId: "run-1", conversationId: "conv-1" } },
      { type: "step", data: { id: "s1", name: "retrieving", status: "started", label: "Searching your documents", detail: { chunks: 10 } }, delay: 100 },
      { type: "step", data: { id: "s1", name: "retrieving", status: "done", label: "Searching your documents", detail: { chunks: 15, documents: 5 } }, delay: 500 },
      { type: "step", data: { id: "s2", name: "generating", status: "started", label: "Writing response" }, delay: 100 },
      { type: "token", data: { text: "Answer based on documents." }, delay: 100 },
      { type: "step", data: { id: "s2", name: "generating", status: "done", label: "Writing response" }, delay: 100 },
      { type: "run.completed", data: { mode: "answered", latencyMs: 800 }, delay: 100 },
    ];

    await page.route("**/api/intelligence/chat/stream", createMockSSEStream(events));

    await page.goto("/intelligence");
    await page.waitForLoadState("networkidle");

    const textarea = page.locator("textarea");
    await textarea.fill("Search my documents");
    await textarea.press("Enter");

    // Check that step labels appear
    await expect(page.locator("text=Searching your documents")).toBeVisible({ timeout: 5000 });

    // Wait for completion
    await expect(page.locator("text=Answer based on documents.")).toBeVisible({ timeout: 10000 });

    // The "Thought process" button should be visible after completion
    await expect(page.locator("text=Thought process")).toBeVisible({ timeout: 5000 });
  });

  test("renders citation chips from SSE stream", async ({ page }) => {
    const events = [
      { type: "run.started", data: { runId: "run-1", conversationId: "conv-1" } },
      { type: "step", data: { id: "s1", name: "generating", status: "started", label: "Generating" }, delay: 50 },
      { type: "token", data: { text: "Based on your documents [1][2], here is the answer." }, delay: 50 },
      { type: "citation", data: { n: 1, documentId: "doc-123", title: "Financial Report Q3", page: 5, quote: "Revenue increased by 15% in Q3." }, delay: 50 },
      { type: "citation", data: { n: 2, documentId: "doc-456", title: "Market Analysis", page: null, quote: "Market trends indicate growth potential." }, delay: 50 },
      { type: "step", data: { id: "s1", name: "generating", status: "done", label: "Generating" }, delay: 50 },
      { type: "run.completed", data: { mode: "answered", latencyMs: 300 }, delay: 50 },
    ];

    await page.route("**/api/intelligence/chat/stream", createMockSSEStream(events));

    await page.goto("/intelligence");
    await page.waitForLoadState("networkidle");

    const textarea = page.locator("textarea");
    await textarea.fill("What are the Q3 results?");
    await textarea.press("Enter");

    // Wait for citations to appear
    await expect(page.locator("text=Financial Report Q3")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Market Analysis")).toBeVisible({ timeout: 5000 });

    // Check page number is shown for citation with page
    await expect(page.locator("text=p.5")).toBeVisible();
  });

  test("renders decline message distinctly", async ({ page }) => {
    const events = [
      { type: "run.started", data: { runId: "run-1", conversationId: "conv-1" } },
      { type: "step", data: { id: "s1", name: "checking_coverage", status: "started", label: "Checking coverage" }, delay: 50 },
      { type: "step", data: { id: "s1", name: "checking_coverage", status: "done", label: "Checking coverage" }, delay: 100 },
      { type: "decline", data: { reason: "not_covered", message: "I can only answer questions using documents uploaded to your organization. I couldn't find anything about this topic in your documents." }, delay: 50 },
      { type: "run.completed", data: { mode: "declined", latencyMs: 200 }, delay: 50 },
    ];

    await page.route("**/api/intelligence/chat/stream", createMockSSEStream(events));

    await page.goto("/intelligence");
    await page.waitForLoadState("networkidle");

    const textarea = page.locator("textarea");
    await textarea.fill("What is quantum computing?");
    await textarea.press("Enter");

    // Verify decline message appears with the polite text
    await expect(page.locator("text=I can only answer questions using documents uploaded to your organization")).toBeVisible({ timeout: 10000 });
  });

  test("stop button aborts streaming", async ({ page }) => {
    // Create a slow stream that we can interrupt
    const events = [
      { type: "run.started", data: { runId: "run-1", conversationId: "conv-1" } },
      { type: "step", data: { id: "s1", name: "generating", status: "started", label: "Generating" }, delay: 100 },
      { type: "token", data: { text: "First " }, delay: 200 },
      { type: "token", data: { text: "token " }, delay: 200 },
      { type: "token", data: { text: "here " }, delay: 200 },
      { type: "token", data: { text: "and " }, delay: 500 },
      { type: "token", data: { text: "more " }, delay: 500 },
      { type: "token", data: { text: "tokens " }, delay: 500 },
      { type: "token", data: { text: "coming " }, delay: 500 },
      { type: "token", data: { text: "slowly." }, delay: 500 },
      { type: "run.completed", data: { mode: "answered", latencyMs: 3000 }, delay: 100 },
    ];

    await page.route("**/api/intelligence/chat/stream", createMockSSEStream(events));

    await page.goto("/intelligence");
    await page.waitForLoadState("networkidle");

    const textarea = page.locator("textarea");
    await textarea.fill("Generate a long response");
    await textarea.press("Enter");

    // Wait for some tokens to appear
    await expect(page.locator("text=First token")).toBeVisible({ timeout: 5000 });

    // Find and click the stop button (Square icon in the send button area)
    const stopButton = page.locator('button[aria-label="Stop"]');
    await expect(stopButton).toBeVisible({ timeout: 2000 });
    await stopButton.click();

    // After stopping, the send button should return (ArrowUp icon)
    const sendButton = page.locator('button[aria-label="Send"]');
    await expect(sendButton).toBeVisible({ timeout: 3000 });

    // The slow tokens should NOT have appeared (they have 500ms delays)
    // Give a small buffer then check that later tokens didn't render
    await page.waitForTimeout(500);
    await expect(page.locator("text=coming slowly")).not.toBeVisible();
  });

  test("handles error events gracefully", async ({ page }) => {
    const events = [
      { type: "run.started", data: { runId: "run-1", conversationId: "conv-1" } },
      { type: "step", data: { id: "s1", name: "retrieving", status: "started", label: "Searching" }, delay: 50 },
      { type: "error", data: { code: "internal_error", message: "An unexpected error occurred. Please try again." }, delay: 100 },
    ];

    await page.route("**/api/intelligence/chat/stream", createMockSSEStream(events));

    await page.goto("/intelligence");
    await page.waitForLoadState("networkidle");

    const textarea = page.locator("textarea");
    await textarea.fill("Trigger an error");
    await textarea.press("Enter");

    // Error should show as a toast
    await expect(page.locator("text=An unexpected error occurred")).toBeVisible({ timeout: 10000 });
  });

  test("falls back to non-streaming when stream returns 404", async ({ page }) => {
    // Mock stream endpoint to return 404
    await page.route("**/api/intelligence/chat/stream", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "Not found" }),
      });
    });

    // Mock fallback non-streaming endpoint
    await page.route("**/api/intelligence/chat", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            reply: "This is a fallback response from the non-streaming endpoint.",
            documents: [],
            thinking: [{ title: "Processed request" }],
            mode: "answered",
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/intelligence");
    await page.waitForLoadState("networkidle");

    const textarea = page.locator("textarea");
    await textarea.fill("Test fallback");
    await textarea.press("Enter");

    // Should see the fallback response
    await expect(page.locator("text=This is a fallback response from the non-streaming endpoint")).toBeVisible({ timeout: 10000 });
  });
});

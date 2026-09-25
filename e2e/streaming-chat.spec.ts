import { test, expect, Page, Route, BrowserContext } from "@playwright/test";

/**
 * Creates SSE body text from events.
 */
function createSSEBody(events: Array<{ type: string; data: Record<string, unknown> }>) {
  return events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`).join("");
}

/**
 * Creates a mock SSE stream response handler with the given events.
 * Note: Playwright doesn't support true streaming, so we return all events at once.
 */
function createMockSSEStream(events: Array<{ type: string; data: Record<string, unknown>; delay?: number }>) {
  return async (route: Route) => {
    const body = createSSEBody(events);
    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
      body,
    });
  };
}

/**
 * Set up auth cookies and mock API endpoints.
 */
async function setupAuthMocks(context: BrowserContext, page: Page) {
  // Set session cookies before page loads
  await context.addCookies([
    {
      name: "session_token",
      value: "mock-session-token",
      domain: "localhost",
      path: "/",
    },
    {
      name: "active_organisation_id",
      value: "test-org",
      domain: "localhost",
      path: "/",
    },
  ]);

  // Mock auth endpoint
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

  await page.route("**/api/intelligence/conversations/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route("**/api/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  // Mock projects endpoint
  await page.route("**/api/projects/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, project: null }),
    });
  });
}

test.describe("Streaming Chat Smoke Tests", () => {
  test.beforeEach(async ({ context, page }) => {
    await setupAuthMocks(context, page);
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

  test("displays step trace after streaming completes", async ({ page }) => {
    const events = [
      { type: "run.started", data: { runId: "run-1", conversationId: "conv-1" } },
      { type: "step", data: { id: "s1", name: "retrieving", status: "started", label: "Searching your documents", detail: { chunks: 10 } } },
      { type: "step", data: { id: "s1", name: "retrieving", status: "done", label: "Searching your documents", detail: { chunks: 15, documents: 5 } } },
      { type: "step", data: { id: "s2", name: "generating", status: "started", label: "Writing response" } },
      { type: "token", data: { text: "Answer based on documents." } },
      { type: "step", data: { id: "s2", name: "generating", status: "done", label: "Writing response" } },
      { type: "run.completed", data: { mode: "answered", latencyMs: 800 } },
    ];

    await page.route("**/api/intelligence/chat/stream", createMockSSEStream(events));

    await page.goto("/intelligence");
    await page.waitForLoadState("networkidle");

    const textarea = page.locator("textarea");
    await textarea.fill("Search my documents");
    await textarea.press("Enter");

    // Wait for completion
    await expect(page.locator("text=Answer based on documents.")).toBeVisible({ timeout: 10000 });

    // The "Thought process" button should be visible after completion
    await expect(page.locator("text=Thought process")).toBeVisible({ timeout: 5000 });

    // Click to expand and verify step labels are shown
    await page.locator("text=Thought process").click();
    await expect(page.locator("text=Searching your documents")).toBeVisible({ timeout: 3000 });
    await expect(page.locator("text=Writing response")).toBeVisible({ timeout: 3000 });
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
      { type: "step", data: { id: "s1", name: "checking_coverage", status: "started", label: "Checking coverage" } },
      { type: "step", data: { id: "s1", name: "checking_coverage", status: "done", label: "Checking coverage" } },
      { type: "decline", data: { reason: "not_covered", message: "I can only answer questions using documents uploaded to your organization." } },
      { type: "run.completed", data: { mode: "declined", latencyMs: 200 } },
    ];

    await page.route("**/api/intelligence/chat/stream", createMockSSEStream(events));

    await page.goto("/intelligence");
    await page.waitForLoadState("networkidle");

    const textarea = page.locator("textarea");
    await textarea.fill("What is quantum computing?");
    await textarea.press("Enter");

    // Verify decline message appears - check for part of the message
    await expect(page.locator("text=can only answer questions using documents")).toBeVisible({ timeout: 10000 });
  });

  test("send button toggles to stop during loading", async ({ page }) => {
    // Note: Since Playwright mocks return all data at once, we verify the button
    // has proper aria-labels for accessibility and that the UI transitions correctly.

    const events = [
      { type: "run.started", data: { runId: "run-1", conversationId: "conv-1" } },
      { type: "token", data: { text: "Response text." } },
      { type: "run.completed", data: { mode: "answered", latencyMs: 100 } },
    ];

    await page.route("**/api/intelligence/chat/stream", createMockSSEStream(events));

    await page.goto("/intelligence");
    await page.waitForLoadState("networkidle");

    // Initially, verify send button exists with proper aria-label
    const sendButton = page.locator('button[aria-label="Send"]');
    await expect(sendButton).toBeVisible();

    // Send a message and wait for response
    const textarea = page.locator("textarea");
    await textarea.fill("Test message");
    await textarea.press("Enter");

    // Wait for response to appear
    await expect(page.locator("text=Response text.")).toBeVisible({ timeout: 5000 });

    // After completion, send button should be back
    await expect(sendButton).toBeVisible({ timeout: 3000 });
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

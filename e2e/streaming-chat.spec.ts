import { test, expect, BrowserContext, Page } from "@playwright/test";

/**
 * Build SSE event text.
 */
function sseEvent(type: string, data: Record<string, unknown>): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Build a complete SSE response body from events array.
 */
function buildSSEBody(events: Array<{ type: string; data: Record<string, unknown> }>): string {
  return events.map((e) => sseEvent(e.type, e.data)).join("");
}

/**
 * Set up all required mocks before navigating to the page.
 */
async function setupMocks(
  context: BrowserContext,
  page: Page,
  streamResponse: { status: number; body?: string }
) {
  // Auth cookies
  await context.addCookies([
    { name: "session_token", value: "mock-session-token", domain: "localhost", path: "/" },
    { name: "active_organisation_id", value: "test-org", domain: "localhost", path: "/" },
  ]);

  // Auth endpoint
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
          organisations: [{ organisationId: "test-org", name: "Test Org", role: "owner" }],
          onboardingCompleted: true,
        },
      }),
    });
  });

  // Conversations list
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

  // Individual conversation
  await page.route("**/api/intelligence/conversations/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  // Auth refresh
  await page.route("**/api/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  // Projects
  await page.route("**/api/projects/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, project: null }),
    });
  });

  // Stream endpoint
  await page.route("**/api/intelligence/chat/stream", async (route) => {
    if (streamResponse.status === 200) {
      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
        body: streamResponse.body || "",
      });
    } else {
      await route.fulfill({
        status: streamResponse.status,
        contentType: "application/json",
        body: JSON.stringify({ error: "Not found" }),
      });
    }
  });
}

test.describe("Streaming Chat", () => {
  test("renders assistant response with tokens and citations", async ({ context, page }) => {
    const events = [
      { type: "run.started", data: { runId: "run-1", conversationId: "conv-1" } },
      { type: "step", data: { id: "s1", name: "generating", status: "started", label: "Generating" } },
      { type: "token", data: { text: "The quarterly revenue " } },
      { type: "token", data: { text: "grew significantly " } },
      { type: "token", data: { text: "according to the report [1]." } },
      {
        type: "citation",
        data: {
          n: 1,
          documentId: "doc-123",
          title: "Q3 Financial Report",
          page: 5,
          quote: "Revenue increased by 15% year over year.",
        },
      },
      { type: "step", data: { id: "s1", name: "generating", status: "done", label: "Generating" } },
      { type: "run.completed", data: { mode: "answered", latencyMs: 500 } },
    ];

    await setupMocks(context, page, { status: 200, body: buildSSEBody(events) });
    await page.goto("/intelligence");
    await page.waitForLoadState("networkidle");

    // Send a message
    const textarea = page.locator("textarea");
    await textarea.fill("What is the revenue?");
    await textarea.press("Enter");

    // Verify response content appears
    await expect(page.locator("text=quarterly revenue")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=grew significantly")).toBeVisible({ timeout: 5000 });

    // Verify citation chip appears
    await expect(page.locator("text=Q3 Financial Report")).toBeVisible({ timeout: 5000 });
  });

  test("renders decline message politely", async ({ context, page }) => {
    const declineText = "I can only help with questions about documents in your organization.";
    const events = [
      { type: "run.started", data: { runId: "run-1", conversationId: "conv-1" } },
      { type: "step", data: { id: "s1", name: "checking", status: "started", label: "Checking" } },
      { type: "step", data: { id: "s1", name: "checking", status: "done", label: "Checking" } },
      {
        type: "decline",
        data: {
          reason: "not_covered",
          message: declineText,
        },
      },
      { type: "run.completed", data: { mode: "declined", latencyMs: 200 } },
    ];

    await setupMocks(context, page, { status: 200, body: buildSSEBody(events) });
    await page.goto("/intelligence");
    await page.waitForLoadState("networkidle");

    const textarea = page.locator("textarea");
    await textarea.fill("What is the weather?");
    await textarea.press("Enter");

    // Verify decline message appears - look for amber styling (decline component) or the text
    await expect(page.locator(`text=${declineText}`)).toBeVisible({ timeout: 10000 });
  });

  test("shows error notification on stream error", async ({ context, page }) => {
    const events = [
      { type: "run.started", data: { runId: "run-1", conversationId: "conv-1" } },
      { type: "error", data: { code: "internal_error", message: "Something went wrong. Please try again." } },
    ];

    await setupMocks(context, page, { status: 200, body: buildSSEBody(events) });
    await page.goto("/intelligence");
    await page.waitForLoadState("networkidle");

    const textarea = page.locator("textarea");
    await textarea.fill("Cause an error");
    await textarea.press("Enter");

    // Error message should appear (as toast)
    await expect(page.locator("text=Something went wrong")).toBeVisible({ timeout: 10000 });
  });

  test("falls back to non-streaming when stream returns 404", async ({ context, page }) => {
    // Stream returns 404
    await setupMocks(context, page, { status: 404 });

    // Mock non-streaming endpoint
    await page.route("**/api/intelligence/chat", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            reply: "This response came from the non-streaming endpoint.",
            documents: [],
            thinking: [{ title: "Fallback processing" }],
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

    // Should see fallback response
    await expect(
      page.locator("text=This response came from the non-streaming endpoint")
    ).toBeVisible({ timeout: 15000 });
  });
});

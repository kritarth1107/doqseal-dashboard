import { describe, expect, it, vi } from "vitest";
import { fetchConversation, fetchConversations, purgeChatLocalStorage } from "@/lib/chat-history";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return Array.from(this.data.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

describe("purgeChatLocalStorage (logout and first load)", () => {
  it("removes every stored chat history and keeps unrelated keys", () => {
    const storage = new MemoryStorage();
    storage.setItem("doqseal.chat.history.org-a", JSON.stringify([{ id: "1", messages: [{ content: "salary 91,000" }] }]));
    storage.setItem("doqseal.chat.history.org-b", "[]");
    storage.setItem("active_organisation_id", "org-a");
    storage.setItem("device_fingerprint", "fp");
    expect(purgeChatLocalStorage(storage)).toBe(2);
    expect(storage.getItem("doqseal.chat.history.org-a")).toBeNull();
    expect(storage.getItem("doqseal.chat.history.org-b")).toBeNull();
    expect(storage.getItem("active_organisation_id")).toBe("org-a");
    expect(storage.getItem("device_fingerprint")).toBe("fp");
  });

  it("never throws when storage is unavailable", () => {
    const broken = {
      get length(): number {
        throw new Error("denied");
      },
    } as unknown as Storage;
    expect(purgeChatLocalStorage(broken)).toBe(0);
    expect(purgeChatLocalStorage(null)).toBe(0);
  });
});

describe("conversation list and detail", () => {
  const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

  it("returns conversations and sends the organisation header", async () => {
    const fetchImpl = vi.fn(async () => ok({ conversations: [{ conversationId: "c1", title: "t" }] }));
    const list = await fetchConversations("org-a", fetchImpl as unknown as typeof fetch);
    expect(list).toEqual([{ conversationId: "c1", title: "t" }]);
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>)["x-organisation-id"]).toBe("org-a");
  });

  it("fails soft to an empty list", async () => {
    expect(await fetchConversations("org-a", (async () => new Response("{}", { status: 404 })) as unknown as typeof fetch)).toEqual([]);
    expect(
      await fetchConversations("org-a", (async () => {
        throw new Error("offline");
      }) as unknown as typeof fetch)
    ).toEqual([]);
    expect(await fetchConversations(null)).toEqual([]);
  });

  it("distinguishes not found from unavailable", async () => {
    expect(await fetchConversation("org-a", "c1", (async () => new Response("{}", { status: 404 })) as unknown as typeof fetch)).toBeNull();
    expect(await fetchConversation("org-a", "c1", (async () => new Response("{}", { status: 502 })) as unknown as typeof fetch)).toBe("error");
    const loaded = await fetchConversation(
      "org-a",
      "c1",
      (async () =>
        ok({
          conversationId: "c1",
          title: "t",
          messages: [{ messageId: "m1", role: "assistant", content: "x [1]", citations: [{ n: 1, documentId: "d" }], mode: "answered" }],
        })) as unknown as typeof fetch
    );
    expect(loaded).toMatchObject({ messages: [{ id: "m1", role: "assistant", citations: [{ documentId: "d" }], mode: "answered" }] });
  });
});

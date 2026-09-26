import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FAST_POLL_MS, MAX_BACKOFF_MS, SLOW_POLL_MS, createPoller, pollDelay } from "../poller";

describe("pollDelay", () => {
  it("polls fast while busy and slowly when idle", () => {
    expect(pollDelay(true, 0)).toBe(FAST_POLL_MS);
    expect(pollDelay(false, 0)).toBe(SLOW_POLL_MS);
  });
  it("backs off after errors up to a cap", () => {
    expect(pollDelay(false, 1)).toBe(FAST_POLL_MS * 2);
    expect(pollDelay(false, 2)).toBe(FAST_POLL_MS * 4);
    expect(pollDelay(false, 10)).toBe(MAX_BACKOFF_MS);
  });
});

describe("createPoller", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("loads immediately, then on the chosen delay", async () => {
    const load = vi.fn().mockResolvedValue({ busy: true });
    const onData = vi.fn();
    const p = createPoller({ load, onData, onError: vi.fn(), nextDelay: () => 1000 });
    p.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(load).toHaveBeenCalledTimes(1);
    expect(onData).toHaveBeenCalledWith({ busy: true });
    await vi.advanceTimersByTimeAsync(1000);
    expect(load).toHaveBeenCalledTimes(2);
    p.stop();
    await vi.advanceTimersByTimeAsync(5000);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("counts errors and passes them to nextDelay", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("x")).mockResolvedValue(1);
    const nextDelay = vi.fn().mockReturnValue(500);
    const onError = vi.fn();
    const p = createPoller({ load, onData: vi.fn(), onError, nextDelay });
    p.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(nextDelay).toHaveBeenLastCalledWith(null, 1);
    await vi.advanceTimersByTimeAsync(500);
    expect(nextDelay).toHaveBeenLastCalledWith(1, 0);
    p.stop();
  });

  it("pauses while the page is hidden and resumes when visible", async () => {
    let hidden = false;
    const load = vi.fn().mockResolvedValue(1);
    const p = createPoller({ load, onData: vi.fn(), onError: vi.fn(), nextDelay: () => 1000, isHidden: () => hidden });
    p.start();
    await vi.advanceTimersByTimeAsync(0);
    hidden = true;
    await vi.advanceTimersByTimeAsync(5000);
    expect(load).toHaveBeenCalledTimes(1);
    hidden = false;
    p.resume();
    await vi.advanceTimersByTimeAsync(0);
    expect(load).toHaveBeenCalledTimes(2);
    p.stop();
  });

  it("refresh loads now and ignores the older in-flight response", async () => {
    let resolveFirst: (v: string) => void = () => undefined;
    const load = vi
      .fn()
      .mockImplementationOnce(() => new Promise<string>((r) => (resolveFirst = r)))
      .mockResolvedValue("fresh");
    const onData = vi.fn();
    const p = createPoller({ load, onData, onError: vi.fn(), nextDelay: () => 10000 });
    p.start();
    await p.refresh();
    resolveFirst("old");
    await vi.advanceTimersByTimeAsync(0);
    expect(onData.mock.calls.map((c) => c[0])).toEqual(["fresh"]);
    const signal = load.mock.calls[0][0] as AbortSignal;
    expect(signal.aborted).toBe(true);
    p.stop();
  });

  it("stops when nextDelay returns null", async () => {
    const load = vi.fn().mockResolvedValue(1);
    const p = createPoller({ load, onData: vi.fn(), onError: vi.fn(), nextDelay: () => null });
    p.start();
    await vi.advanceTimersByTimeAsync(60000);
    expect(load).toHaveBeenCalledTimes(1);
    p.stop();
  });
});

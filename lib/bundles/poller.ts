/**
 * Small polling loop used by the case pack screens. The delay is chosen after
 * every tick (fast while documents are being sorted, slow otherwise, backing
 * off after errors), polling pauses while the tab is hidden, and a manual
 * refresh resets the timer.
 */

export interface PollerOptions<T> {
  load: (signal: AbortSignal) => Promise<T>;
  onData: (data: T) => void;
  onError: (error: unknown) => void;
  /** Delay before the next tick; return null to stop. */
  nextDelay: (last: T | null, errorCount: number) => number | null;
  isHidden?: () => boolean;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

export interface Poller {
  start: () => void;
  refresh: () => Promise<void>;
  stop: () => void;
  /** Call when the page becomes visible again. */
  resume: () => void;
}

export const FAST_POLL_MS = 4000;
export const SLOW_POLL_MS = 20000;
export const MAX_BACKOFF_MS = 60000;

export function pollDelay(busy: boolean, errorCount: number): number {
  if (errorCount > 0) return Math.min(MAX_BACKOFF_MS, FAST_POLL_MS * 2 ** errorCount);
  return busy ? FAST_POLL_MS : SLOW_POLL_MS;
}

export function createPoller<T>(opts: PollerOptions<T>): Poller {
  const setTimer = opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = opts.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  const isHidden = opts.isHidden ?? (() => false);
  let timer: unknown = null;
  let controller: AbortController | null = null;
  let stopped = true;
  let last: T | null = null;
  let errors = 0;
  let pausedWhileHidden = false;

  const clear = () => {
    if (timer !== null) clearTimer(timer);
    timer = null;
  };

  const schedule = () => {
    clear();
    if (stopped) return;
    const delay = opts.nextDelay(last, errors);
    if (delay === null) return;
    timer = setTimer(() => {
      timer = null;
      if (isHidden()) {
        pausedWhileHidden = true;
        return;
      }
      void tick();
    }, delay);
  };

  const tick = async () => {
    if (stopped) return;
    controller?.abort();
    const current = new AbortController();
    controller = current;
    try {
      const data = await opts.load(current.signal);
      if (stopped || current.signal.aborted) return;
      last = data;
      errors = 0;
      opts.onData(data);
    } catch (err) {
      if (stopped || current.signal.aborted) return;
      errors += 1;
      opts.onError(err);
    } finally {
      if (controller === current) {
        controller = null;
        schedule();
      }
    }
  };

  return {
    start() {
      if (!stopped) return;
      stopped = false;
      void tick();
    },
    async refresh() {
      if (stopped) return;
      clear();
      await tick();
    },
    stop() {
      stopped = true;
      clear();
      controller?.abort();
      controller = null;
    },
    resume() {
      if (stopped || !pausedWhileHidden) return;
      pausedWhileHidden = false;
      void tick();
    },
  };
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T>;

  return function (...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastCall);
    lastArgs = args;

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastCall = now;
      func(...lastArgs);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        func(...lastArgs);
      }, remaining);
    }
  } as T;
}

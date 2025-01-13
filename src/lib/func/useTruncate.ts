import { onMount } from "svelte";

function debounce(func: () => void, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(func, wait);
  };
}

export function useTruncate(
  node: HTMLElement,
  {
    maxHeight = 380,
    isTruncated,
    threshold = 200,
  }: {
    maxHeight?: number;
    isTruncated?: (value: boolean) => void;
    threshold?: number;
  }
) {
  const checkHeight = debounce(() => {
    const truncated = node.scrollHeight > maxHeight + threshold;
    if (isTruncated) {
      isTruncated(truncated);
    }
  }, 100);

  let resizeObserver: ResizeObserver;

  onMount(() => {
    checkHeight();

    // ResizeObserver で高さや幅の変化を監視
    resizeObserver = new ResizeObserver(() => {
      checkHeight();
    });
    resizeObserver.observe(node);

    return () => {
      resizeObserver.disconnect();
    };
  });

  return {
    update({
      maxHeight: newMaxHeight,
      threshold: newThreshold,
    }: {
      maxHeight: number;
      threshold?: number;
    }) {
      maxHeight = newMaxHeight;
      if (newThreshold !== undefined) {
        threshold = newThreshold;
      }
      checkHeight();
    },
    destroy() {
      node.style.maxHeight = "";
      node.style.overflow = "";
    },
  };
}

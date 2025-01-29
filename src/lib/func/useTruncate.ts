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
    maxHeight,
    isTruncated,
    threshold,
  }: {
    maxHeight: number;
    isTruncated?: (value: boolean) => void;
    threshold: number;
  }
) {
  const checkHeight = /* debounce(*/ () => {
    const truncated = node.scrollHeight > maxHeight + threshold;
    if (isTruncated) {
      isTruncated(truncated);
    }
  }; /*, 200);*/

  let resizeObserver: ResizeObserver;

  function handleImageLoad() {
    checkHeight();
  }

  onMount(() => {
    //checkHeight();

    // ResizeObserver で高さや幅の変化を監視
    resizeObserver = new ResizeObserver(() => {
      checkHeight();
    });
    resizeObserver.observe(node);

    // 画像の読み込みが終わったときに高さをチェック
    const images = node.querySelectorAll("img");
    images.forEach((img) => {
      img.addEventListener("load", handleImageLoad);
    });

    return () => {
      resizeObserver.disconnect();
      images.forEach((img) => {
        img.removeEventListener("load", handleImageLoad);
      });
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

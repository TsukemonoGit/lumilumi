import { onMount } from "svelte";

// カスタムアクション：truncate
export function useTruncate(
  node: HTMLElement,
  {
    maxHeight = 320,
    isTruncated,
    threshold = 200,
  }: {
    maxHeight?: number;
    isTruncated?: (value: boolean) => void;
    threshold?: number;
  }
) {
  // 高さをチェックしてボタン表示を制御
  function checkHeight() {
    const truncated = node.scrollHeight > maxHeight + threshold;
    if (isTruncated) {
      isTruncated(truncated);
    }
  }

  function handleImageLoad() {
    checkHeight();
  }

  onMount(() => {
    checkHeight();
    const images = node.querySelectorAll("img");
    images.forEach((img) => {
      img.addEventListener("load", handleImageLoad);
    });

    return () => {
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

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
  // debounce を使用してResizeObserverのループエラーを防ぐ
  const checkHeight = debounce(() => {
    // DOM が存在し、まだ接続されているかチェック
    if (!node || !node.isConnected) {
      return;
    }

    try {
      const truncated = node.scrollHeight > maxHeight + threshold;
      if (isTruncated) {
        isTruncated(truncated);
      }
    } catch (error) {
      // サイズ計算でエラーが発生した場合は無視
      console.warn("Height calculation error:", error);
    }
  }, 100); // debounce を短めに設定

  let resizeObserver: ResizeObserver | null = null;
  let isDestroyed = false;

  function handleImageLoad() {
    if (!isDestroyed) {
      checkHeight();
    }
  }

  onMount(() => {
    // 初期チェックもdebounce
    const initialCheck = debounce(() => {
      if (!isDestroyed) {
        checkHeight();
      }
    }, 50);

    initialCheck();

    // ResizeObserver でエラー処理を追加
    try {
      resizeObserver = new ResizeObserver((entries) => {
        // エントリーが空の場合は処理しない
        if (entries.length === 0 || isDestroyed) {
          return;
        }

        // RAF を使用してレンダリングサイクルと同期
        requestAnimationFrame(() => {
          if (!isDestroyed) {
            checkHeight();
          }
        });
      });

      resizeObserver.observe(node);
    } catch (error) {
      console.warn("ResizeObserver initialization failed:", error);
    }

    // 画像の読み込みが終わったときに高さをチェック
    const images = node.querySelectorAll("img");
    images.forEach((img) => {
      // 既に読み込み済みの画像もチェック
      if (img.complete) {
        handleImageLoad();
      } else {
        img.addEventListener("load", handleImageLoad, { once: true });
        img.addEventListener("error", handleImageLoad, { once: true });
      }
    });

    return () => {
      isDestroyed = true;

      if (resizeObserver) {
        try {
          resizeObserver.disconnect();
        } catch (error) {
          console.warn("ResizeObserver disconnect failed:", error);
        }
        resizeObserver = null;
      }

      images.forEach((img) => {
        img.removeEventListener("load", handleImageLoad);
        img.removeEventListener("error", handleImageLoad);
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
      if (isDestroyed) return;

      maxHeight = newMaxHeight;
      if (newThreshold !== undefined) {
        threshold = newThreshold;
      }

      // update時もdebounce
      const debouncedUpdate = debounce(() => {
        if (!isDestroyed) {
          checkHeight();
        }
      }, 50);

      debouncedUpdate();
    },

    destroy() {
      isDestroyed = true;

      if (resizeObserver) {
        try {
          resizeObserver.disconnect();
        } catch (error) {
          console.warn("ResizeObserver disconnect in destroy failed:", error);
        }
        resizeObserver = null;
      }

      // スタイルのリセット
      try {
        if (node && node.style) {
          node.style.maxHeight = "";
          node.style.overflow = "";
        }
      } catch (error) {
        console.warn("Style reset failed:", error);
      }
    },
  };
}

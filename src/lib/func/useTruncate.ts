import type { Attachment } from "svelte/attachments";
import { tick } from "svelte";

export function useTruncate(
  getConfig: () => {
    maxHeight: number;
    isTruncated?: (value: boolean) => void;
    threshold: number;
  }
): Attachment {
  return (element: Element) => {
    if (!(element instanceof HTMLElement)) {
      console.warn("useTruncate requires an HTMLElement");
      return;
    }

    let resizeObserver: ResizeObserver | null = null;
    let isDestroyed = false;
    let rafId: number | null = null;
    let initialTimeout: ReturnType<typeof setTimeout> | null = null;

    const checkHeight = () => {
      if (isDestroyed || !element.isConnected) return;

      try {
        const { maxHeight, isTruncated, threshold } = getConfig();
        const truncated = element.scrollHeight > maxHeight + threshold;
        isTruncated?.(truncated);
      } catch (error) {
        console.warn("Height calculation error:", error);
      }
    };

    // RAF で重複チェックを防止
    const scheduledCheck = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        checkHeight();
      });
    };

    const initialCheck = async () => {
      await tick();
      if (isDestroyed) return;

      // 即座チェック
      scheduledCheck();

      // 遅延チェック（メディア読み込み考慮）
      initialTimeout = setTimeout(() => {
        if (!isDestroyed) scheduledCheck();
      }, 300);
    };

    initialCheck();

    // ResizeObserver
    resizeObserver = new ResizeObserver(() => {
      if (!isDestroyed) scheduledCheck();
    });
    resizeObserver.observe(element);

    // メディア要素の読み込み監視
    const handleMediaLoad = () => {
      if (!isDestroyed) scheduledCheck();
    };

    const images = element.querySelectorAll("img");
    images.forEach((img) => {
      if (!img.complete) {
        img.addEventListener("load", handleMediaLoad, { once: true });
        img.addEventListener("error", handleMediaLoad, { once: true });
      }
    });

    const videos = element.querySelectorAll("video");
    videos.forEach((video) => {
      video.addEventListener("loadedmetadata", handleMediaLoad, { once: true });
    });

    const iframes = element.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      iframe.addEventListener("load", handleMediaLoad, { once: true });
    });

    return () => {
      isDestroyed = true;

      if (rafId !== null) cancelAnimationFrame(rafId);
      if (initialTimeout) clearTimeout(initialTimeout);

      resizeObserver?.disconnect();
      resizeObserver = null;

      images.forEach((img) => {
        img.removeEventListener("load", handleMediaLoad);
        img.removeEventListener("error", handleMediaLoad);
      });

      videos.forEach((video) => {
        video.removeEventListener("loadedmetadata", handleMediaLoad);
      });

      iframes.forEach((iframe) => {
        iframe.removeEventListener("load", handleMediaLoad);
      });

      if (element.style) {
        element.style.maxHeight = "";
        element.style.overflow = "";
      }
    };
  };
}

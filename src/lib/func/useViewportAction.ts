import type { Action } from "svelte/action";

// Svelte アクションとしての `viewport`
export const viewport: Action<
  HTMLElement,
  null,
  {
    onenterViewport?: (e: CustomEvent) => void; // ビューポートに入った際のコールバック
    onexitViewport?: (e: CustomEvent) => void; // ビューポートから出た際のコールバック
  }
> = (node) => {
  // IntersectionObserver のコールバック
  const callback: IntersectionObserverCallback = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        //   console.log("enter");
        node.dispatchEvent(new CustomEvent("enterViewport"));
      } else {
        //    console.log("exit");
        node.dispatchEvent(new CustomEvent("exitViewport"));
      }
    });
  };

  // 各ノードごとに個別の IntersectionObserver を作成
  const intersectionObserver = new IntersectionObserver(callback);

  // このノードを監視対象に追加
  intersectionObserver.observe(node);

  return {
    destroy() {
      // ノードの監視を解除
      intersectionObserver.unobserve(node);
    },
  };
};

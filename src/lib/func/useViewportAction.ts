import type { Action } from "svelte/action";

// Svelte アクションとしての `viewport`
export const viewport: Action<
  HTMLElement,
  null,
  {
    onenterViewport?: (e: CustomEvent) => void;
    onexitViewport?: (e: CustomEvent) => void;
  }
> = (node, parameter) => {
  const callback: IntersectionObserverCallback = (entries) => {
    entries.forEach((entry) => {
      node.dispatchEvent(
        new CustomEvent(entry.isIntersecting ? "enterViewport" : "exitViewport")
      );
    });
  };

  const intersectionObserver = new IntersectionObserver(callback);
  intersectionObserver.observe(node);

  return {
    destroy() {
      intersectionObserver.unobserve(node);
    },
  };
};

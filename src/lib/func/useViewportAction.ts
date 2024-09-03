let intersectionObserver: IntersectionObserver;

function ensureIntersectionObserver() {
  if (intersectionObserver) return;

  intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const eventName = entry.isIntersecting ? "enterViewport" : "exitViewport";
      entry.target.dispatchEvent(new CustomEvent(eventName)); // カスタムイベントを発火
    });
  });
}

export default function viewport(element: HTMLElement) {
  ensureIntersectionObserver();

  intersectionObserver.observe(element);

  return {
    destroy() {
      intersectionObserver.unobserve(element); // クリーンアップ
    },
  };
}

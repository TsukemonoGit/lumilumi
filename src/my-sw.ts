/// <reference lib="webworker" />
// src/service-worker.js (例)
(self as any).__WB_MANIFEST; // Workbox がマニフェストを自動的に挿入します
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js"
);
let data: {
  url: string | undefined;
  text: string | undefined;
  title: string | undefined;
  media: File[] | undefined;
};

self.addEventListener("install", (event) => {
  console.log("Service Worker: Installed");
  // Cache assets, perform other setup tasks here
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activated");
  // Activate the new service worker and clean old caches, etc.
});

self.addEventListener("fetch", (event) => {
  if (
    event.request.method === "POST" &&
    new URL(event.request.url).pathname === "/post"
  ) {
    const clonedRequest = event.request.clone();

    event.respondWith(
      clonedRequest.formData().then((formData) => {
        data = {
          url: formData.get("url"),
          text: formData.get("text"),
          title: formData.get("title"),
          media: formData.getAll("media"),
        };
        return handlePostRequest(data);
      })
    );
  }
});

async function handlePostRequest(event) {
  const clonedRequest = event.request.clone();
  clonedRequest.formData().then(async (formData) => {
    data = {
      url: formData.get("url"),
      text: formData.get("text"),
      title: formData.get("title"),
      media: formData.getAll("media"),
    };

    if (data.media) {
      const cache = await caches.open("media-cache");
      await Promise.all(
        data.media.map(async (file, index) => {
          const cacheRequest = new Request(
            `/cached-media/${file.name}-${index}`,
            { method: "GET" }
          );
          const cacheResponse = new Response(file, {
            headers: { "Content-Type": file.type },
          });
          await cache.put(cacheRequest, cacheResponse);
        })
      );
    }
  });

  const allClients = await (self as any).clients.matchAll({
    includeUncontrolled: true,
  });
  await Promise.all(
    allClients.map((client) => {
      return client.postMessage({
        title: data.title,
        text: data.text,
        url: data.url,
        media: data.media
          ? data.media.map(
              (file, index) => `/cached-media/${file.name}-${index}`
            )
          : null,
      });
    })
  );

  return new Response("", { status: 200 });
}

self.addEventListener("message", (event) => {
  console.log(event);
  if (event.data && event.data.type === "requestLatestData") {
    // 以前キャッシュされたデータを再送信する
    sendLatestDataToClient(event.source);
  }
});
async function sendLatestDataToClient(client) {
  // キャッシュから最新データを取得して送信
  const cache = await caches.open("media-cache");
  const cacheData = await cache.match("/cached-media");
  if (cacheData) {
    const mediaUrls = await cacheData.text();
    const response = {
      title: data.title,
      text: data.text,
      url: data.url,
      media: mediaUrls.split("\n"),
    };
    client.postMessage(response);
  } else {
    const response = {
      title: data.title,
      text: data.text,
      url: data.url,
    };
    client.postMessage(response);
  }
}

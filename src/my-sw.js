/// <reference lib="webworker" />
// src/service-worker.js (例)
self.__WB_MANIFEST;  // Workbox がマニフェストを自動的に挿入します

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js');


self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  // Cache assets, perform other setup tasks here
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  // Activate the new service worker and clean old caches, etc.
});
self.addEventListener("fetch", (event) => {
  if (
    event.request.method === "POST" &&
    new URL(event.request.url).pathname === "/post"
  ) {
    event.respondWith(
      (async function () {
        const formData = await event.request.formData();
        title = formData.get("title");
        text = formData.get("text");
        url = formData.get("url");
        const mediaFiles = formData.getAll("media");

        // Cacheにファイルを保存
        const cache = await caches.open("media-cache");
        await Promise.all(
          mediaFiles.map(async (file, index) => {
            const cacheRequest = new Request(`/cached-media/${file.name}-${index}`, { method: "GET" });
            const cacheResponse = new Response(file, {
              headers: { "Content-Type": file.type },
            });
            await cache.put(cacheRequest, cacheResponse);
          })
        );

        // クライアントに通知
        const allClients = await self.clients.matchAll({
          includeUncontrolled: true,
        });
        allClients.forEach((client) => {
          client.postMessage({
            title,
            text,
            url,
            media: mediaFiles.map((file, index) => `/cached-media/${file.name}-${index}`),
          });
        });

        return new Response("", { status: 200 });
      })()
    );
  }
});
self.addEventListener("message", (event) => {
  console.log(event)
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
      title: title,
      text: text,
      url: url,
      media: mediaUrls.split("\n"),
    };
    client.postMessage(response);
  } else {
    const response = {
      title: title,
      text: text,
      url: url,

    };
    client.postMessage(response);
  }
}
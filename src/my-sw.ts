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
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 不要なキャッシュを削除する
          if (cacheName !== "media-cache") {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", async (event) => {
  if (
    event.request &&
    event.request.method === "POST" &&
    new URL(event.request.url).pathname === "/post"
  ) {
    console.log("fetch event:", event);
    return handlePostRequest(event.request);
  }
});

let media;

async function handlePostRequest(request) {
  if (!request) {
    console.error("Request is undefined");
    return new Response("Invalid Request", { status: 400 });
  }

  const formData = await request.clone().formData();
  data = {
    url: formData.get("url"),
    text: formData.get("text"),
    title: formData.get("title"),
    media: formData.getAll("media"),
  };
  console.log("data", data);
  // メディアキャッシュ処理
  if (data.media && data.media.length > 0) {
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

  // クライアントへの送信
  const allClients = await (self as any).clients.matchAll({
    includeUncontrolled: true,
  });
  await Promise.all(
    allClients.map((client) => {
      return client.postMessage({
        title: data.title,
        text: data.text,
        url: data.url,
        media: media,
      });
    })
  );

  return new Response("", { status: 200 });
}

self.addEventListener("message", (event) => {
  console.log(event);
  if (event.data && event.data.type === "requestLatestData") {
    // 以前キャッシュされたデータを再送信する
    //event.source?.postMessage(clonedRequest);
    sendLatestDataToClient(event.source);
  }
});
async function sendLatestDataToClient(client) {
  // キャッシュから最新データを取得して送信

  const response = data
    ? {
        title: data.title,
        text: data.text,
        url: data.url,
        media: media,
      }
    : null;
  client.postMessage(response);
}

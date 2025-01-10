//my-sw
/// <reference lib="WebWorker" />
/// <reference types="vite/client" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
import { precacheAndRoute } from "workbox-precaching";
import {
  cacheNames,
  clientsClaim,
  type RouteHandlerCallbackOptions,
} from "workbox-core";
import { NetworkFirst, NetworkOnly, Strategy } from "workbox-strategies";
import {
  registerRoute,
  setCatchHandler,
  setDefaultHandler,
} from "workbox-routing";
import { ExpirationPlugin } from "workbox-expiration";

import type { ManifestEntry } from "workbox-build";
import type { StrategyHandler } from "workbox-strategies";

// Give TypeScript the correct global.
declare let self: ServiceWorkerGlobalScope;
declare type ExtendableEvent = any;

const mediaCacheName = "media-cache";
const cacheName = cacheNames.runtime;
let media: string[] | null;
const config = {
  race: false,
  debug: false,
  credentials: "same-origin",
  networkTimeoutSeconds: 0,
  fallback: "app.html",
};

let targetData: {
  url: string | undefined;
  text: string | undefined;
  title: string | undefined;
  media: File[] | undefined;
};

const manifest = self.__WB_MANIFEST as Array<ManifestEntry>;

const cacheEntries: RequestInfo[] = [];

const manifestURLs = manifest.map(
  (entry) => new URL(entry.url, self.location.href).href
);

// --- Event Listeners ---
self.addEventListener("install", handleInstallEvent);
self.addEventListener("activate", handleActivateEvent);
self.addEventListener("fetch", handleFetchEvent);
self.addEventListener("message", handleMessageEvent);

//リソースの取得方法を定義し、ネットワーク優先の戦略（NetworkFirst）を使用しています。
registerRoute(({ url }) => manifestURLs.includes(url.href), buildStrategy());
// ?type=avatar を含む URL だけをキャッシュ
registerRoute(
  ({ url }) => url.searchParams.get("type") === "avatar",
  new NetworkFirst({
    cacheName: "avatar-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7日
      }),
    ],
  })
);

// その他の画像、動画はキャッシュしない
registerRoute(
  ({ request }) =>
    request.destination === "image" || request.destination === "video",
  new NetworkOnly()
);

setDefaultHandler(new NetworkFirst({ cacheName }));

// fallback to app-shell for document request
setCatchHandler(
  async (options: RouteHandlerCallbackOptions): Promise<Response> => {
    if (options.request.destination === "document") {
      const fallback = await caches.match(config.fallback);
      return fallback || Response.error();
    }
    return Response.error();
  }
);
// this is necessary, since the new service worker will keep on skipWaiting state
// and then, caches will not be cleared since it is not activated
self.skipWaiting();
clientsClaim();

function buildStrategy(): Strategy {
  if (config.race) {
    class CacheNetworkRace extends Strategy {
      _handle(
        request: Request,
        handler: StrategyHandler
      ): Promise<Response | undefined> {
        const fetchAndCachePutDone: Promise<Response> =
          handler.fetchAndCachePut(request);
        const cacheMatchDone: Promise<Response | undefined> =
          handler.cacheMatch(request);

        return new Promise((resolve, reject) => {
          fetchAndCachePutDone.then(resolve).catch((e) => {
            if (config.debug)
              console.log(`Cannot fetch resource: ${request.url}`, e);
          });
          cacheMatchDone.then((response) => response && resolve(response));

          // Reject if both network and cache error or find no response.
          Promise.allSettled([fetchAndCachePutDone, cacheMatchDone]).then(
            (results) => {
              const [fetchAndCachePutResult, cacheMatchResult] = results;
              if (
                fetchAndCachePutResult.status === "rejected" &&
                cacheMatchResult.status === "fulfilled" &&
                !cacheMatchResult.value
              )
                reject(fetchAndCachePutResult.reason);
            }
          );
        });
      }
    }
    return new CacheNetworkRace();
  }
  return config.networkTimeoutSeconds > 0
    ? new NetworkFirst({
        cacheName,
        networkTimeoutSeconds: config.networkTimeoutSeconds,
      })
    : new NetworkFirst({ cacheName });
}

async function handleInstallEvent(event: ExtendableEvent) {
  event.waitUntil(
    caches
      .open(cacheName)
      .then(async (cache) => {
        const existingRequests = await cache.keys();
        const existingURLs = new Set(existingRequests.map((req) => req.url));
        const newEntries = cacheEntries.filter(
          (entry) => !existingURLs.has((entry as Request).url)
        );

        if (newEntries.length > 0) {
          try {
            await cache.addAll(newEntries);
          } catch (err) {
            console.error("Failed to cache some resources:", err);
          }
        }
      })
      .then(() => {
        // キャッシュ追加後にサービスワーカーをすぐにアクティブにする
        self.skipWaiting();
      })
  );
}

async function handleActivateEvent(event: ExtendableEvent) {
  event.waitUntil(
    caches.open(cacheName).then(async (cache) => {
      const cacheKeys = await cache.keys();
      for (const request of cacheKeys) {
        if (!manifestURLs.includes(request.url)) {
          await cache.delete(request);
        }
      }
    }),
    caches.open(mediaCacheName).then(async (cache) => {
      const cacheKeys = await cache.keys();
      for (const request of cacheKeys) {
        await cache.delete(request);
      }
    })
  );
}

async function handleFetchEvent(event: FetchEvent) {
  if (
    event.request.method === "POST" &&
    new URL(event.request.url).pathname === "/post"
  ) {
    return handlePostRequest(event.request);
  }
}

async function handlePostRequest(request) {
  if (!request) {
    console.error("Request is undefined");
    return new Response("Invalid Request", { status: 400 });
  }

  const formData = await request.clone().formData();
  targetData = {
    url: formData.get("url"),
    text: formData.get("text"),
    title: formData.get("title"),
    media: formData.getAll("media"),
  };
  console.log("data", targetData);
  // メディアキャッシュ処理
  if (targetData.media && targetData.media.length > 0) {
    const cache = await caches.open(mediaCacheName);
    await Promise.all(
      targetData.media.map(async (file, index) => {
        const cacheRequest = new Request(
          `/cached-media/${file.name}-${index}`,
          {
            method: "GET",
          }
        );
        const cacheResponse = new Response(file, {
          headers: {
            "Content-Type": file.type,
          },
        });
        await cache.put(cacheRequest, cacheResponse);
      })
    );
  }

  // クライアントへの送信
  const allClients = await (self as any).clients.matchAll({
    includeUncontrolled: true,
  });
  media = targetData.media
    ? targetData.media.map(
        (file, index) => `/cached-media/${file.name}-${index}`
      )
    : null;
  console.log(media);
  await Promise.all(
    allClients.map((client) => {
      return client.postMessage({
        title: targetData.title,
        text: targetData.text,
        url: targetData.url,
        media: media,
      });
    })
  );

  return new Response("", { status: 200 });
}

async function handleMessageEvent(event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  console.log(event);

  // 以前キャッシュされたデータを再送信する
  if (event.data && event.data.type === "requestLatestData") {
    //event.source?.postMessage(clonedRequest);
    await sendLatestDataToClient(event.source);
    return;
  }

  //共有用メディアキャッシュ削除
  if (event.data && event.data.type === "DELETE_CACHE") {
    caches
      .open(mediaCacheName)
      .then(async (cache) => {
        const cacheKeys = await cache.keys();
        for (const request of cacheKeys) {
          await cache.delete(request);
        }
      })
      .finally(() => {
        event.ports[0].postMessage({ success: true });
      });
    //const cache = await caches.open("media-cache");
    //await cache.delete(event.data.url);
    //event.ports[0].postMessage({ success: true });
  }
}

async function sendLatestDataToClient(client) {
  // キャッシュから最新データを取得して送信

  const response = targetData
    ? {
        title: targetData.title,
        text: targetData.text,
        url: targetData.url,
        media: media,
      }
    : null;
  client.postMessage(response);
}

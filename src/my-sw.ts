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

import type { ManifestEntry } from "workbox-build";
import type { StrategyHandler } from "workbox-strategies";

// Give TypeScript the correct global.
declare let self: ServiceWorkerGlobalScope;
declare type ExtendableEvent = any;

const cacheName = cacheNames.runtime;

const config = {
  race: false,
  debug: false,
  credentials: "same-origin",
  networkTimeoutSeconds: 0,
  fallback: "index.html",
};

let targetData: {
  url: string | undefined;
  text: string | undefined;
  title: string | undefined;
  media: File[] | undefined;
};

// --- Event Listeners ---
self.addEventListener("install", handleInstallEvent);
self.addEventListener("activate", handleActivateEvent);
self.addEventListener("fetch", handleFetchEvent);
self.addEventListener("message", handleMessageEvent);

const manifest = self.__WB_MANIFEST as Array<
  ManifestEntry & { revision: string }
>;

const cacheEntries: RequestInfo[] = [];

const manifestURLs = manifest.map((entry) => {
  const url = new URL(entry.url, self.location.href);
  cacheEntries.push(
    new Request(url.href, {
      credentials: config.credentials as any,
    })
  );
  return url.href;
});

//リソースの取得方法を定義し、ネットワーク優先の戦略（NetworkFirst）を使用しています。
registerRoute(({ url }) => manifestURLs.includes(url.href), buildStrategy());

setDefaultHandler(new NetworkOnly());

// fallback to app-shell for document request
setCatchHandler(
  async (options: RouteHandlerCallbackOptions): Promise<Response> => {
    switch (options.request.destination) {
      case "document":
        const r = await caches.match(config.fallback).catch(() => null);
        return await (r
          ? Promise.resolve(r)
          : Promise.resolve(Response.error()));
      default:
        return Promise.resolve(Response.error());
    }
  }
);

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
  } else {
    if (config.networkTimeoutSeconds > 0) {
      const networkTimeoutSeconds = config.networkTimeoutSeconds;
      return new NetworkFirst({ cacheName, networkTimeoutSeconds });
    } else {
      return new NetworkFirst({ cacheName });
    }
  }
}

function handleInstallEvent(event: ExtendableEvent) {
  event.waitUntil(
    caches.open(cacheName).then(async (cache) => {
      const existingRequests = await cache.keys();
      const existingURLs = new Set(existingRequests.map((req) => req.url));
      const newEntries = cacheEntries.filter(
        (entry) =>
          !existingURLs.has(typeof entry === "string" ? entry : entry.url)
      );
      return cache.addAll(newEntries);
    })
  );
}

function handleActivateEvent(event: ExtendableEvent) {
  // - clean up outdated runtime cache
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      // clean up those who are not listed in manifestURLs
      cache.keys().then((keys) => {
        keys.forEach((request) => {
          config.debug &&
            console.log(`Checking cache entry to be removed: ${request.url}`);
          if (!manifestURLs.includes(request.url)) {
            cache.delete(request).then((deleted) => {
              if (config.debug) {
                if (deleted)
                  console.log(
                    `Precached data removed: ${request.url || request}`
                  );
                else
                  console.log(`No precache found: ${request.url || request}`);
              }
            });
          }
        });
      });
    })
  );
}

async function handleFetchEvent(event) {
  if (
    event.request &&
    event.request.method === "POST" &&
    new URL(event.request.url).pathname === "/post"
  ) {
    console.log("fetch event:", event);
    return handlePostRequest(event.request);
  }
}

let media;

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
    const cache = await caches.open("media-cache");
    await Promise.all(
      targetData.media.map(async (file, index) => {
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
  if (event.data && event.data.type === "requestLatestData") {
    // 以前キャッシュされたデータを再送信する
    //event.source?.postMessage(clonedRequest);
    await sendLatestDataToClient(event.source);
    return;
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

// this is necessary, since the new service worker will keep on skipWaiting state
// and then, caches will not be cleared since it is not activated
self.skipWaiting();
clientsClaim();

//service-worker
/// <reference lib="WebWorker" />
/// <reference types="vite/client" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
import { precacheAndRoute } from "workbox-precaching";
// service-worker.ts
import { cacheNames, clientsClaim } from "workbox-core";
import type { RouteHandlerCallbackOptions } from "workbox-core";
import { NetworkFirst, NetworkOnly, Strategy } from "workbox-strategies";
import {
  registerRoute,
  setCatchHandler,
  setDefaultHandler,
} from "workbox-routing";
import { ExpirationPlugin } from "workbox-expiration";
import type { StrategyHandler } from "workbox-strategies";

// TypeScriptのグローバル型定義
declare let self: ServiceWorkerGlobalScope;
declare type ExtendableEvent = any;

// 型定義
interface ManifestEntry {
  url: string;
  revision?: string | null;
}

interface TargetData {
  url?: string;
  text?: string;
  title?: string;
  media?: File[];
}

interface LatestData {
  title?: string;
  text?: string;
  url?: string;
  media?: string[] | null;
}

// キャッシュ名定義
const mediaCacheName = "media-cache";
const cacheName = cacheNames.runtime;
const CACHE_NAME = "avatar-cache";

// キャッシュ設定
const MAX_ENTRIES = 100;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7日
const CHECK_INTERVAL = 30 * 1000; // 30秒
const REMAINING_TIME_THRESHOLD = 60 * 60 * 24 * 1000; // 1日

// グローバル変数
let media: string[] | null = null;
let targetData: TargetData = {};
let lastCheckedTime = 0;

// 設定
const config = {
  race: false,
  debug: false,
  credentials: "same-origin",
  networkTimeoutSeconds: 0,
  fallback: "app.html",
};

// マニフェスト処理
const manifest = self.__WB_MANIFEST as ManifestEntry[];
const cacheEntries: RequestInfo[] = [];
const manifestURLs = manifest.map(
  (entry) => new URL(entry.url, self.location.href).href
);

// --- イベントリスナー登録 ---
self.addEventListener("install", handleInstallEvent);
self.addEventListener("activate", handleActivateEvent);
self.addEventListener("fetch", handleFetchEvent);
self.addEventListener("message", handleMessageEvent);

// ルート登録: マニフェストリソース
registerRoute(({ url }) => manifestURLs.includes(url.href), buildStrategy());

// キャッシュキー生成(ハッシュ削除)
const cacheKeyWillBeUsed = async ({
  request,
}: {
  request: Request;
}): Promise<string> => {
  const url = new URL(request.url);
  url.hash = "";
  return url.toString();
};

// キャッシュレスポンス処理(期限チェック)
const cachedResponseWillBeUsed = async ({
  cacheName,
  cachedResponse,
  request,
}: {
  cacheName: string;
  cachedResponse?: Response;
  request: Request;
}): Promise<Response | null> => {
  const now = Date.now();

  if (now - lastCheckedTime < CHECK_INTERVAL) {
    return cachedResponse || null;
  }

  lastCheckedTime = now;

  if (!cachedResponse) return null;

  const cache = await caches.open(cacheName);
  const dateHeader = cachedResponse.headers.get("date");

  if (dateHeader) {
    const cachedTime = new Date(dateHeader).getTime();
    const remainingTime = cachedTime + MAX_AGE_SECONDS * 1000 - now;

    if (remainingTime < REMAINING_TIME_THRESHOLD) {
      await cache.put(request, cachedResponse.clone());
    }
  }

  return cachedResponse;
};

// ルート登録: #cache付きURL
registerRoute(
  ({ url }) => url.hash === "#cache",
  new NetworkFirst({
    cacheName: CACHE_NAME,
    plugins: [
      new ExpirationPlugin({
        maxEntries: MAX_ENTRIES,
        maxAgeSeconds: MAX_AGE_SECONDS,
      }),
      { cacheKeyWillBeUsed },
      { cachedResponseWillBeUsed },
    ],
  })
);

// ルート登録: 画像・動画(キャッシュしない)
registerRoute(
  ({ request }) =>
    request.destination === "image" || request.destination === "video",
  new NetworkOnly()
);

// デフォルトハンドラ
setDefaultHandler(new NetworkFirst({ cacheName }));

// フォールバック処理
setCatchHandler(
  async (options: RouteHandlerCallbackOptions): Promise<Response> => {
    if (options.request.destination === "document") {
      const fallback = await caches.match(config.fallback);
      return fallback || Response.error();
    }
    return Response.error();
  }
);

// ユーザーが明示的に更新ボタンをクリックするまで、新しいService Workerの適用を待機
// skipWaiting()とclientsClaim()を即座に実行すると、通知UIが表示される前にリロードされる
self.skipWaiting();
clientsClaim();

// ストラテジー構築
function buildStrategy(): Strategy {
  if (config.race) {
    class CacheNetworkRace extends Strategy {
      _handle(request: Request, handler: StrategyHandler): Promise<Response> {
        const fetchAndCachePutDone: Promise<Response> =
          handler.fetchAndCachePut(request);
        const cacheMatchDone: Promise<Response | undefined> =
          handler.cacheMatch(request);

        return new Promise((resolve, reject) => {
          fetchAndCachePutDone.then(resolve).catch((e) => {
            if (config.debug) {
              console.log(`Cannot fetch resource: ${request.url}`, e);
            }
          });

          cacheMatchDone.then((response) => response && resolve(response));

          Promise.allSettled([fetchAndCachePutDone, cacheMatchDone]).then(
            (results) => {
              const [fetchAndCachePutResult, cacheMatchResult] = results;
              if (
                fetchAndCachePutResult.status === "rejected" &&
                cacheMatchResult.status === "fulfilled" &&
                !cacheMatchResult.value
              ) {
                reject(fetchAndCachePutResult.reason);
              }
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

// installイベント処理
async function handleInstallEvent(event: ExtendableEvent): Promise<void> {
  event.waitUntil(
    caches
      .open(cacheName)
      .then(async (cache) => {
        let existingRequests: readonly Request[] = [];
        try {
          existingRequests = await cache.keys();
          if (existingRequests.length > 1000) {
            console.warn(
              "[SW] Too many cache entries, skipping install cache population"
            );
            return;
          }
        } catch (e) {
          console.error("[SW] cache.keys() failed during install:", e);
          return;
        }

        const existingURLs = new Set(existingRequests.map((req) => req.url));
        const newEntries = cacheEntries.filter(
          (entry) => !existingURLs.has((entry as Request).url)
        );

        if (newEntries.length > 0) {
          try {
            await cache.addAll(newEntries);
          } catch (err) {
            console.error("[SW] Failed to cache some install resources:", err);
          }
        }
      })
      .then(() => {
        self.skipWaiting();
      })
  );
}

// activateイベント処理
async function handleActivateEvent(event: ExtendableEvent): Promise<void> {
  event.waitUntil(
    Promise.all([
      // ランタイムキャッシュのクリーンアップ
      (async () => {
        try {
          const cache = await caches.open(cacheName);
          const cacheKeys = await cache.keys();
          if (cacheKeys.length > 2000) {
            console.warn(
              "[SW] Too many cache entries, skipping manifest clean"
            );
          } else {
            await Promise.all(
              cacheKeys.map((request) => {
                if (!manifestURLs.includes(request.url)) {
                  return cache.delete(request);
                }
                return Promise.resolve(false);
              })
            );
          }
        } catch (e) {
          console.error("[SW] cache.keys() failed during activate:", e);
        }
      })(),
      // メディアキャッシュのクリア
      (async () => {
        try {
          const mediaCache = await caches.open(mediaCacheName);
          const mediaKeys = await mediaCache.keys();
          if (mediaKeys.length > 1000) {
            console.warn("[SW] Too many media cache entries, clearing all");
          }
          await Promise.all(mediaKeys.map((req) => mediaCache.delete(req)));
        } catch (e) {
          console.error("[SW] Failed to clear media cache:", e);
        }
      })(),
    ])
  );
}

// fetchイベント処理
async function handleFetchEvent(event: FetchEvent): Promise<void> {
  if (
    event.request.method === "POST" &&
    new URL(event.request.url).pathname === "/post"
  ) {
    event.respondWith(handlePostRequest(event.request));
  }
}

// POSTリクエスト処理
async function handlePostRequest(request: Request): Promise<Response> {
  if (!request) {
    console.error("Request is undefined");
    return new Response("Invalid Request", { status: 400 });
  }

  try {
    const formData = await request.clone().formData();

    const getString = (v: FormDataEntryValue | null): string | undefined =>
      typeof v === "string" ? v : undefined;

    const mediaEntries = formData
      .getAll("media")
      .filter((v): v is File => v instanceof File);

    targetData = {
      url: getString(formData.get("url")),
      text: getString(formData.get("text")),
      title: getString(formData.get("title")),
      media: mediaEntries.length > 0 ? mediaEntries : undefined,
    };

    console.log("data", targetData);

    // メディアキャッシュ処理
    if (targetData.media && targetData.media.length > 0) {
      const cache = await caches.open(mediaCacheName);
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

    const payload: LatestData = {
      title: targetData.title,
      text: targetData.text,
      url: targetData.url,
      media,
    };

    const typedClients = allClients as ReadonlyArray<Client>;
    await Promise.all(
      typedClients.map((client) => Promise.resolve(client.postMessage(payload)))
    );

    return new Response("", { status: 200 });
  } catch (error) {
    console.error("Error handling POST request:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// messageイベント処理
async function handleMessageEvent(
  event: ExtendableMessageEvent
): Promise<void> {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  console.log(event);

  // 最新データの再送信
  if (event.data?.type === "requestLatestData") {
    const source = event.source;
    if (source && "postMessage" in source) {
      await sendLatestDataToClient(source);
    }
    return;
  }

  // メディアキャッシュ削除
  if (event.data && event.data.type === "DELETE_CACHE") {
    try {
      const cache = await caches.open(mediaCacheName);
      const cacheKeys = await cache.keys();
      await Promise.all(cacheKeys.map((request) => cache.delete(request)));
      event.ports[0].postMessage({ success: true });
    } catch (error) {
      console.error("Error deleting cache:", error);
      event.ports[0].postMessage({ success: false, error: String(error) });
    }
  }
}

// クライアントへ最新データを送信
async function sendLatestDataToClient(
  client: Client | MessagePort | ServiceWorker
): Promise<void> {
  const response: LatestData | null =
    Object.keys(targetData).length > 0
      ? {
          title: targetData.title,
          text: targetData.text,
          url: targetData.url,
          media,
        }
      : null;

  client.postMessage(response);
}

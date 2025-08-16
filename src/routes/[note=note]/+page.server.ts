// src/routes/[note=note]/+page.server.ts

import type { PageServerLoad } from "./$types";
import { createRxNostr, createRxBackwardReq, type EventPacket } from "rx-nostr";
import * as nip19 from "nostr-tools/nip19";
import { filter } from "rxjs";
import type { nip19 as Nip19 } from "nostr-tools";
import { verifier } from "@rx-nostr/crypto";
import WebSocket from "ws";
import { defaultRelays } from "$lib/stores/relays";

export const load: PageServerLoad = async ({ request, params, setHeaders }) => {
  const secFetchDest = request.headers.get("sec-fetch-dest") || "";
  const acceptHeader = request.headers.get("accept") || "";

  // ブラウザからのアクセスかを推測
  // - sec-fetch-destが'document'である（ブラウザのナビゲーション）
  // - かつ、AcceptヘッダーがHTMLを含む（ブラウザがページを要求している）
  const isBrowserRequest =
    secFetchDest === "document" && acceptHeader.includes("text/html");

  // ブラウザからの直接アクセスと判断された場合
  if (isBrowserRequest) {
    setHeaders({
      "X-Robots-Tag": "noindex, nofollow",
    });
    return {};
  }

  // ここからは、ブラウザではないアクセス（OGPクローラー、検索ボットなど）向けのロジック
  const { note } = params;
  let eventId: string;
  let relaysToUse: string[];

  try {
    const { type, data } = nip19.decode(note);
    if (type === "nevent") {
      const neventData = data as Nip19.EventPointer;
      eventId = neventData.id;
      relaysToUse = neventData.relays?.length
        ? neventData.relays
        : defaultRelays;
    } else if (type === "note") {
      eventId = data as string;
      relaysToUse = defaultRelays;
    } else {
      return {
        ogp: { title: "エラー", description: "無効なNostr IDタイプです。" },
      };
    }
  } catch (e) {
    console.error("Nostr IDのデコードに失敗:", e);
    return { ogp: { title: "エラー", description: "無効なNostr IDです。" } };
  }

  const rxNostr = createRxNostr({
    websocketCtor: WebSocket,
    verifier: verifier,
    eoseTimeout: 5000,
  });
  rxNostr.setDefaultRelays(relaysToUse);

  try {
    const req = createRxBackwardReq();
    const events = rxNostr.use(req);

    const noteEventPromise = new Promise<EventPacket | undefined>((resolve) => {
      const eventsSub = events
        .pipe(filter((packet: EventPacket) => packet.event.id === eventId))
        .subscribe({
          next: (packet) => {
            resolve(packet);
            eventsSub.unsubscribe();
          },
          error: () => {
            resolve(undefined);
          },
        });

      // 接続状態を監視して、1つでもConnectになったらemit
      const connSub = rxNostr
        .createConnectionStateObservable()
        .subscribe((packet) => {
          if (packet.state.toLowerCase() === "connect") {
            // 小文字比較で安全
            req.emit({ ids: [eventId] });

            // 接続確立後にのみタイムアウト開始
            setTimeout(() => {
              resolve(undefined); // 5秒以内に来なければundefined
              eventsSub.unsubscribe();
            }, 5000);

            connSub.unsubscribe();
          }
        });
    });

    const note = await noteEventPromise;

    if (note) {
      const ogpTitle = `Nostr Note by ${note.event.pubkey.substring(0, 8)}...`;
      const ogpDescription =
        note.event.content.substring(0, 150) +
        (note.event.content.length > 150 ? "..." : "");
      return {
        ogp: { title: ogpTitle, description: ogpDescription },
        noteData: note.event,
      };
    }
  } catch (e) {
    console.error("rx-nostrでのイベント取得に失敗:", e);
  } finally {
    rxNostr.dispose();
  }

  return {
    ogp: {
      title: "ノートが見つかりません",
      description: "このノートは存在しないか、見つけられませんでした。",
    },
    noteData: null,
  };
};

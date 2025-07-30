import { NSEC } from "$env/static/private";

import type { RequestHandler } from "./$types";
import {
  finalizeEvent,
  nip04,
  nip19,
  //SimplePool,
  verifyEvent,
  type EventTemplate,
} from "nostr-tools";
//import { defaultRelays } from "$lib/stores/relays";
import { error } from "@sveltejs/kit";
import DataStore from "../datastore"; // データストアをインポート
import { useWebSocketImplementation } from "nostr-tools/pool";
//import { otpEvent } from "$lib/stores/stores";
const OTP_TTL = 60000; // 5分（300,000ミリ秒）

export const GET: RequestHandler = async ({ url: request }) => {
  const pubkey = request.searchParams.get("pubkey");
  useWebSocketImplementation(WebSocket);
  if (!pubkey) {
    throw error(404, {
      message: "require pubkey param",
    });
  }

  const code = Math.floor(Math.random() * 10 ** 7);
  const text = `code: ${code}`;
  const encrypt = await nip04.encrypt(
    nip19.decode(NSEC).data as Uint8Array,
    pubkey,
    text
  );
  const eventTemplate: EventTemplate = {
    kind: 4,
    content: encrypt,
    created_at: Math.floor(Date.now() / 1000),
    tags: [["p", pubkey]],
  };

  // otpcodeをデータストアに保存し、TTLを設定
  const dataStore = DataStore.getInstance();
  dataStore.set(pubkey, code, OTP_TTL);

  const signedEvent = finalizeEvent(
    eventTemplate,
    nip19.decode(NSEC).data as Uint8Array
  );
  let isGood = verifyEvent(signedEvent);
  console.log(isGood);
  //otpEvent.set(signedEvent);

  return new Response(JSON.stringify(signedEvent), {
    status: 200,
  });
};

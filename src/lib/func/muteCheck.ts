import { mutebykinds, mutes } from "$lib/stores/stores";
import type { LumiMute, LumiMuteByKind } from "$lib/types";

import * as Nostr from "nostr-typedef";
import { get } from "svelte/store";

export type MuteCheck =
  | "pubkey"
  | "word"
  | "hashtag"
  | "thread"
  | "kind"
  | "null";

type EventWithContentPubkeyTags = Pick<
  Nostr.Event,
  "content" | "tags" | "pubkey"
> &
  Partial<Omit<Nostr.Event, "content" | "tags" | "pubkey">>;

export function muteCheck(event: EventWithContentPubkeyTags): MuteCheck {
  const mutesValue = get(mutes);
  const mutebykindsValue = get(mutebykinds);

  if (mutesValue) {
    if (shouldMuteByP(event, mutesValue)) {
      return "pubkey";
    }
    if (shouldMuteByWord(event, mutesValue)) {
      return "word";
    }
    if (shouldMuteByT(event, mutesValue)) {
      return "hashtag";
    }
    if (shouldMuteByE(event, mutesValue)) {
      return "thread";
    }
  }

  if (shouldMuteByKinds(event, mutebykindsValue)) {
    return "kind";
  }

  return "null";
}

function shouldMuteByP(
  event: EventWithContentPubkeyTags,
  mutesValue: LumiMute,
): boolean {
  if (!event.pubkey) {
    return false;
  }
  const pMutes = mutesValue.list.p ?? [];
  return pMutes.includes(event.pubkey);
}

function shouldMuteByWord(
  event: EventWithContentPubkeyTags,
  mutesValue: LumiMute,
): boolean {
  const wordMutes = mutesValue.list.word ?? [];
  return wordMutes.some((muteWord) => event.content.includes(muteWord));
}

function shouldMuteByT(
  event: EventWithContentPubkeyTags,
  mutesValue: LumiMute,
): boolean {
  const tMutes = mutesValue.list.t ?? [];
  const tagsWithT = event.tags.filter((tag) => tag[0] === "t");
  return tagsWithT.some((tag) => tMutes.includes(tag[1]));
}

function shouldMuteByE(
  event: EventWithContentPubkeyTags,
  mutesValue: LumiMute,
): boolean {
  if (!event.id) {
    return false;
  }
  const eMutes = mutesValue.list.e ?? [];
  const tagsWithE = event.tags.filter(
    (tag) => tag[0] === "e" || tag[0] === "q",
  );
  return (
    eMutes.includes(event.id) ||
    tagsWithE.some((tag) => eMutes.includes(tag[1]))
  );
}

function shouldMuteByKinds(
  event: EventWithContentPubkeyTags,
  mutebykindsValue: LumiMuteByKind | undefined | null,
): boolean {
  if (!mutebykindsValue) {
    return false;
  }
  const kindsMutes = mutebykindsValue.list ?? [];
  for (const entry of kindsMutes) {
    if (entry.kind === event.kind && entry.list.includes(event.pubkey)) {
      return true;
    }
  }
  return false;
}

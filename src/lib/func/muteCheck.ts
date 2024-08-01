import { mutebykinds, mutes } from "$lib/stores/stores";
import * as Nostr from "nostr-typedef";
import { get } from "svelte/store";
export type MuteCheck =
  | "pubkey"
  | "word"
  | "hashtag"
  | "event"
  | "kind"
  | "null";
export function muteCheck(event: Nostr.Event): MuteCheck {
  if (get(mutes)) {
    // Check if the event should be muted based on mutes.p
    if (shouldMuteByP(event)) {
      return "pubkey";
    }

    // Check if the event should be muted based on mutes.word
    if (shouldMuteByWord(event)) {
      return "word";
    }

    // Check if the event should be muted based on mutes.t
    if (shouldMuteByT(event)) {
      return "hashtag";
    }

    // Check if the event should be muted based on mutes.e
    if (shouldMuteByE(event)) {
      return "event";
    }
  }

  // Check if the event should be muted based on mutebykinds
  if (shouldMuteByKinds(event)) {
    return "kind";
  }

  // If none of the mute conditions match, allow the event to pass through
  return "null";
}

function shouldMuteByP(event: Nostr.Event): boolean {
  const pMutes = get(mutes)?.p || [];

  return pMutes.includes(event.pubkey); // Replace with actual property check
}

function shouldMuteByWord(event: Nostr.Event): boolean {
  const wordMutes = get(mutes)?.word || [];
  //----------------------------------------------------------------------ワードミュートはとりあえずkind:1,7,42に限ってみる
  //表示もできるようになったからやっぱKind何でも隠すにしてみる
  // Check if any word mute from wordMutes array is included in event.content
  return wordMutes.some((muteWord) => event.content.includes(muteWord));
}

function shouldMuteByT(event: Nostr.Event): boolean {
  const tMutes = get(mutes)?.t || [];

  // Find all tags in event.tags where tag[0] is "t"
  const tagsWithT = event.tags.filter((tag) => tag[0] === "t");

  // Check if any tag[1] (the value of the tag where tag[0] === "t") is in tMutes
  return tagsWithT.some((tag) => tMutes.includes(tag[1]));
}

function shouldMuteByE(event: Nostr.Event): boolean {
  const eMutes = get(mutes)?.e || [];
  const tagsWithE = event.tags.filter(
    (tag) => tag[0] === "e" || tag[0] === "q"
  );
  return (
    eMutes.includes(event.id) ||
    tagsWithE.some((tag) => eMutes.includes(tag[1]))
  ); // Replace with actual property check
}

function shouldMuteByKinds(event: Nostr.Event): boolean {
  const kindsMutes = get(mutebykinds) || [];

  // Implement logic to check if event.kind and other properties match mutebykinds criteria
  // Example logic:

  for (const entry of kindsMutes) {
    if (entry.kind === event.kind && entry.list.includes(event.pubkey)) {
      return true;
    }
  }
  return false;
}

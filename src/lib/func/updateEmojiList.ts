// $lib/func/updateEmojiList.ts
import type { Event } from "nostr-typedef";
import { emojis } from "$lib/stores/stores";
import { createEmojiListFrom10030 } from "$lib/func/settings";
import { STORAGE_KEYS } from "./localStorageKeys";

export async function updateEmojiListFromEvent(event: Event) {
  const list = await createEmojiListFrom10030(event);

  const newEmojiData = {
    list: list,
    updated: Math.floor(Date.now() / 1000),
    event: event,
  };

  emojis.set(newEmojiData);
  try {
    localStorage.setItem(STORAGE_KEYS.LUMI_EMOJI, JSON.stringify(newEmojiData));
  } catch (error) {
    console.log("failed to save localStorage");
  }
}

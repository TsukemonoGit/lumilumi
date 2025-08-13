import { emojis, queryClient } from "$lib/stores/stores";
import type { Profile } from "$lib/types";
import { nip19 } from "nostr-tools";
import { type EventPacket, latest } from "rx-nostr";
import { get } from "svelte/store";
import { usePromiseReq } from "./nostr";
import { npubRegex } from "./regex";

// ----------------------------------------
// Tag Management
// ----------------------------------------
export function addEmojiTag(tags: string[][], emoji: string[]): string[][] {
  const newTags = [...tags]; // 元の配列をコピー

  // 1. URLが同じ絵文字を探す
  const sameEmoji = newTags.find(
    (tag) => tag[0] === "emoji" && tag[2] === emoji[1]
  );

  if (sameEmoji) {
    // 同じURLの絵文字があれば、その名前を使う（何もしない）
    return newTags;
  }

  // 2. 同じ名前の絵文字があるか確認
  let currentEmojiName = emoji[0];
  let sameNameEmoji = newTags.find(
    (tag) => tag[0] === "emoji" && tag[1] === currentEmojiName
  );

  // 3. 名前の重複を解決
  if (sameNameEmoji) {
    if (sameNameEmoji[2] !== emoji[1]) {
      // 名前が同じでURLが異なる場合、新しい名前を付けて追加
      const baseName = currentEmojiName;
      let num = 1;

      do {
        currentEmojiName = `${baseName}_${num}`;
        sameNameEmoji = newTags.find(
          (tag) => tag[0] === "emoji" && tag[1] === currentEmojiName
        );
        num++;
      } while (sameNameEmoji);

      newTags.push(["emoji", currentEmojiName, emoji[1]]);
    }
    // 完全に同じ名前・URLの絵文字がある場合は何もしない
  } else {
    // 同じ名前もURLもない場合、新しい絵文字として追加
    newTags.push(["emoji", currentEmojiName, emoji[1]]);
  }

  return newTags;
}

// 試行済みのhexを記録するSet
const attemptedHexes = new Set<string>();
// 記録をリセットする関数
export function resetEmojiCache(): void {
  attemptedHexes.clear();
}

// 特定のhexのみリセットする関数（オプション）
export function resetEmojiCacheForHex(hex: string): void {
  attemptedHexes.delete(hex);
}

export async function checkCustomEmojis(
  tags: string[][],
  input: string
): Promise<string[][]> {
  let returnTags = [...tags];
  const emojiMatches = input.match(/:[a-zA-Z0-9_]+:/g);

  if (!emojiMatches) return returnTags;

  const emojiList = get(emojis);

  const processEmoji = async (emoji: string): Promise<void> => {
    const emojiName = emoji.slice(1, -1);

    // 既に同じ名前のタグがあったらスキップ
    if (returnTags.find((tag) => tag[0] === "emoji" && tag[1] === emojiName)) {
      return;
    }

    // 絵文字リストから探す
    const customEmoji = emojiList.list.find((e) => e[0] === emojiName);
    if (customEmoji) {
      returnTags = addEmojiTag(returnTags, customEmoji);
    } else if (npubRegex.test(emojiName)) {
      try {
        const hex = nip19.decode(emojiName)?.data as string;

        const profile = await getUserProfile(hex);

        const picture = profile?.picture;
        if (picture) {
          returnTags = addEmojiTag(returnTags, [emojiName, picture]);
        }
      } catch (error) {
        console.warn(`Failed to process npub emoji: ${emojiName}`, error);
      }
    }
  };

  await Promise.allSettled(emojiMatches.map(processEmoji));
  return returnTags;
}

export const getUserProfile = async (hex: string): Promise<Profile | null> => {
  // キャッシュされたデータを確認
  const cachedData = queryClient.getQueryData(["metadata", hex]) as
    | EventPacket
    | undefined;

  if (cachedData?.event) {
    return JSON.parse(cachedData.event.content) as Profile;
  }
  // 既に試行済みならスキップ//試行済みでもキャッシュある分は確認する
  if (attemptedHexes.has(hex)) {
    return null;
  }
  // 試行済みとしてマーク（ネットワーク取得前に）
  attemptedHexes.add(hex);
  // ネットワークから取得（ここに到達するのは初回のみ）
  const metadata = await usePromiseReq(
    {
      filters: [{ authors: [hex], limit: 1, kinds: [0] }],
      operator: latest(),
    },
    undefined,
    3000
  );

  if (metadata[0]?.event) {
    return JSON.parse(metadata[0].event.content) as Profile;
  }

  return null;
};

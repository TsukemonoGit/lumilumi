import { emojis, queryClient } from "$lib/stores/stores";
import type { Profile } from "$lib/types";
import { nip19 } from "nostr-tools";
import { type EventPacket, latest } from "rx-nostr";
import { get } from "svelte/store";
import { usePromiseReq } from "./nostr";
import { npubRegex } from "./regex";
import { extractEmojiSet } from "./contentCheck";

type EmojiPair = [string, string];

// ----------------------------------------
// Emoji Tag Management
// ----------------------------------------
export function addEmojiTag(
  tags: string[][],
  emoji: string[]
): { tags: string[][]; finalName: string } {
  const newTags = [...tags];

  // 1. URLが同じ絵文字を探す
  const sameEmoji = newTags.find(
    (tag) => tag[0] === "emoji" && tag[2] === emoji[1]
  );

  if (sameEmoji) {
    return { tags: newTags, finalName: sameEmoji[1] };
  }

  // 2. 同じ名前の絵文字があるか確認
  let currentEmojiName = emoji[0];
  let sameNameEmoji = newTags.find(
    (tag) => tag[0] === "emoji" && tag[1] === currentEmojiName
  );

  // 3. 名前の重複を解決
  if (sameNameEmoji) {
    if (sameNameEmoji[2] !== emoji[1]) {
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
  } else {
    newTags.push(["emoji", currentEmojiName, emoji[1]]);
  }

  console.log(newTags);
  return { tags: newTags, finalName: currentEmojiName };
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

/**
 * テキスト中の `:emoji:` 形式のトークンを走査し、
 * 既存タグに存在しないカスタム絵文字を検出して `emoji` タグとして追加する。
 *
 * - 既に同名の emoji タグがある場合は追加しない
 * - ローカルの絵文字リストに存在する場合はその URL を使用
 * - `npub` 形式の場合はプロフィール取得後、picture を絵文字 URL として使用
 *
 * @param tags 既存の Nostr event tags
 * @param input 投稿本文
 * @returns 絵文字タグを追加した tags 配列
 */
export async function collectEmojiTagsFromText(
  tags: string[][],
  input: string
): Promise<string[][]> {
  let returnTags = [...tags];
  const emojiSet = extractEmojiSet(input);
  if (emojiSet.size === 0) return returnTags;

  const emojiList = get(emojis);
  const newEmojiPairs: EmojiPair[] = [];

  await Promise.allSettled(
    [...emojiSet].map(async (emojiName) => {
      if (returnTags.some((t) => t[0] === "emoji" && t[1] === emojiName))
        return;

      const customEmoji = emojiList.list.find((e) => e[0] === emojiName);
      if (customEmoji) {
        newEmojiPairs.push([customEmoji[0], customEmoji[1]]);
        return;
      }

      if (npubRegex.test(emojiName)) {
        try {
          const hex = nip19.decode(emojiName)?.data as unknown as string;
          const profile = await getUserProfile(hex);
          if (profile?.picture) {
            newEmojiPairs.push([emojiName, profile.picture]);
          }
        } catch {}
      }
    })
  );

  for (const pair of newEmojiPairs) {
    returnTags = addEmojiTag(returnTags, pair).tags;
  }

  return returnTags;
}

export const getUserProfile = async (hex: string): Promise<Profile | null> => {
  // キャッシュされたデータを確認
  const cachedData = queryClient.getQueryData(["metadata", hex]) as
    | EventPacket
    | undefined;

  if (cachedData?.event) {
    try {
      return JSON.parse(cachedData.event.content) as Profile;
    } catch (error) {
      console.warn(`Failed to parse cached profile for ${hex}:`, error);
    }
  }

  // 既に試行済みならスキップ
  if (attemptedHexes.has(hex)) {
    return null;
  }

  // 試行済みとしてマーク（ネットワーク取得前に）
  attemptedHexes.add(hex);

  // ネットワークから取得
  const metadata = await usePromiseReq(
    {
      filters: [{ authors: [hex], limit: 1, kinds: [0] }],
      operator: latest(),
    },
    undefined,
    3000
  );

  if (metadata[0]?.event) {
    try {
      return JSON.parse(metadata[0].event.content) as Profile;
    } catch (error) {
      console.warn(`Failed to parse profile for ${hex}:`, error);
    }
  }

  return null;
};

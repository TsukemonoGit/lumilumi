import * as nip19 from "nostr-tools/nip19";
import { hashtagRegex, nip19Regex, urlRegex } from "./regex";
import { emojis } from "$lib/stores/stores";
import { get } from "svelte/store";

export function contentCheck(
  text: string,
  tags: string[][]
): { text: string; tags: string[][] } {
  let newTags = [...tags];

  // 絵文字タグを抽出
  const emojiTag = tags
    .filter((tag) => tag[0] === "emoji")
    .map((tag) => tag[1]);

  // 絵文字タグをテキスト内でチェックし、含まれていない場合に削除
  emojiTag.forEach((emoji) => {
    if (!text.includes(`:${emoji}:`)) {
      newTags = newTags.filter((tag) => tag[0] !== "emoji" || tag[1] !== emoji);
    }
  });
  // 画像タグを抽出
  const imetaURLRegex = /url\s(.*[^\s])/;
  const imetaTag = tags.filter((tag) => tag[0] === "imeta");
  // URL 部分を抽出
  const imetaURLs = imetaTag
    .map((tag) => tag.find((item) => imetaURLRegex.test(item)))
    .filter((urlTag): urlTag is string => !!urlTag)
    .map((urlTag) => {
      const match = imetaURLRegex.exec(urlTag);
      return match ? match[1] : null;
    })
    .filter((url): url is string => !!url);
  // 画像をテキスト内でチェックし、含まれていない場合に削除
  imetaURLs.forEach((url) => {
    if (!text.includes(url)) {
      newTags = newTags.filter(
        (tag) => tag[0] !== "imeta" || !tag.find((item) => item.includes(url))
      );
    }
  });

  // Process NIP-19 matches

  const nip19Matches = text.matchAll(nip19Regex);

  for (const match of nip19Matches) {
    const matchValue = match?.[1] ?? match?.[0]; // fallback

    if (!matchValue) continue;

    try {
      const decoded = nip19.decode(matchValue);

      switch (decoded.type) {
        case "nevent": {
          const neventTag = [
            "q",
            decoded.data.id,
            decoded.data.relays?.[0] ?? "",
          ];

          if (decoded.data.author) {
            neventTag.push(decoded.data.author);
          }
          newTags.push(neventTag);
          break;
        }

        case "naddr": {
          const addrTag = [
            "q",
            `${decoded.data.kind}:${decoded.data.pubkey}:${decoded.data.identifier}`,
          ];

          if (decoded.data.relays?.[0]) {
            addrTag.push(decoded.data.relays[0]);
          }

          newTags.push(addrTag);
          break;
        }

        case "note":
          newTags.push(["q", decoded.data]);
          break;

        default:
          break;
      }
    } catch (error) {
      console.log(
        "Failed to decode NIP-19 identifier:",
        match?.[1] ?? match?.[0]
      );
    }
  }

  // Process URL matches
  const urlMatches = text.matchAll(urlRegex);
  const urls = [...urlMatches].map((match) => ["r", match[0]]);
  newTags.push(...Array.from(new Set(urls)));

  //hashtag
  const hashtagMatches = text.matchAll(hashtagRegex);
  const hashtags = [...hashtagMatches]
    .map((match) => ["t", match.groups?.hashtag.toLowerCase()])
    .filter((x): x is string[] => x !== undefined);
  newTags.push(...Array.from(new Set(hashtags)));

  return { text, tags: newTags };
}

/**
 * 本文に含まれていない絵文字に対応する `emoji` タグを削除する。
 *
 * - `:emoji:` が本文に存在しない場合、その emoji タグを除外
 * - text 自体は変更せず、そのまま返す
 *
 * @param text 投稿本文
 * @param tags Nostr event tags
 * @returns text と不要な emoji タグを除去した tags
 */
export function pruneEmojiTagsByText(
  text: string,
  tags: string[][]
): { text: string; tags: string[][] } {
  let newTags = [...tags];

  const emojiTag = tags
    .filter((tag) => tag[0] === "emoji")
    .map((tag) => tag[1]);

  emojiTag.forEach((emoji) => {
    if (!text.includes(`:${emoji}:`)) {
      newTags = newTags.filter((tag) => tag[0] !== "emoji" || tag[1] !== emoji);
    }
  });

  return { text, tags: newTags };
}

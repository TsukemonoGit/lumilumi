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

export function contentEmojiCheck(
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

  return { text, tags: newTags };
}

export function checkCustomEmojis(input: string): string[][] | undefined {
  const emojiMatches = input.match(/:[a-zA-Z0-9_]+:/g);

  if (!emojiMatches) return;
  let returnTags: string[][] = [];
  emojiMatches.forEach((emoji) => {
    const emojiName = emoji.slice(1, -1);
    const customEmoji = get(emojis).list.find((e) => e[0] === emojiName);

    if (customEmoji) {
      returnTags = addEmojiTag(returnTags, customEmoji);
    }
  });
  return returnTags;
}

function addEmojiTag(tags: string[][], emoji: string[]): string[][] {
  // 1. URLが同じ絵文字を探す
  const sameEmoji = tags.find(
    (tag) => tag[0] === "emoji" && tag[2] === emoji[1] // URLが同じ
  );

  if (sameEmoji) {
    // 同じURLの絵文字があれば、その名前を使う
    emoji[0] = sameEmoji[1];
  }

  // 2. 同じ名前の絵文字があるか確認
  let sameNameEmoji = tags.find(
    (tag) => tag[0] === "emoji" && tag[1] === emoji[0]
  );

  // 3. 絵文字の条件に従って追加処理
  if (sameNameEmoji) {
    // 名前が同じでURLが異なる場合、新しい名前を付けて追加
    if (sameNameEmoji[2] !== emoji[1]) {
      // 元の名前を保存
      const baseName = emoji[0];
      let num = 1;

      // 重複しない名前が見つかるまでnumをインクリメント
      emoji[0] = `${baseName}_${num}`;
      sameNameEmoji = tags.find(
        (tag) => tag[0] === "emoji" && tag[1] === emoji[0]
      );

      while (sameNameEmoji) {
        num++;
        emoji[0] = `${baseName}_${num}`;
        sameNameEmoji = tags.find(
          (tag) => tag[0] === "emoji" && tag[1] === emoji[0]
        );
      }

      tags.push(["emoji", ...emoji]);
    }
    // 完全に同じ名前・URLの絵文字がある場合は何もしない
  } else {
    // 同じ名前もURLもない場合、新しい絵文字として追加
    tags.push(["emoji", ...emoji]);
  }
  return tags;
}

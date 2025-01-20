import { nip19 } from "nostr-tools";
import { parseNaddr } from "./util";
import {
  nip19Regex,
  urlRegex,
  nipRegex,
  relayRegex,
  invoiceRegex,
} from "./regex";

export interface Part {
  type:
    | "nip19"
    | "url"
    | "emoji"
    | "hashtag"
    | "nip"
    | "relay"
    | "text"
    | "quote"
    | "invoice";
  content: string | undefined;
  url?: string;
  number?: number;
  headers?: string[];
  rows?: string[][];
  list?: Part[];
  imageUrl?: string;
}

//旧引用
export const numberRegex = /(#\[\d+\])/i;
//

export const numberQuoteEncode = (text: string, tags: string[][]): string => {
  try {
    const num = parseInt(text.slice(2, -1));
    const tag = tags[num];
    if (tag[0] === "e") {
      return nip19.noteEncode(tag[1]);
    } else if (tag[0] === "a") {
      return nip19.naddrEncode(parseNaddr(tag));
    } else if (tag[0] === "p") {
      return nip19.npubEncode(tag[1]);
    }
    return "";
  } catch (error) {
    return "";
  }
};

//---------------------------------------------------------------------------parseText
export async function parseText(
  input: string,
  tags: string[][]
): Promise<Part[]> {
  const parts: Part[] = [];
  let remainingText = input;
  let mediaNum = 0;
  // Create emoji set from tags
  const emojiSet = new Set(
    tags
      .filter((tag) => tag[0] === "emoji")
      .map((tag) => `:${tag[1]}:`)
      .sort((a, b) => b.length - a.length)
  );

  // Create hashtag set for exact matching
  //lowercaseにして重複削除
  const lowerHashtagSet = new Set(
    tags
      .filter((tag) => tag[0] === "t")
      .map((tag) => `#${tag[1].toLowerCase()}`) // lowercaseに変換
  );

  const hashtagSet = Array.from(lowerHashtagSet).sort(
    (a, b) => b.length - a.length
  );

  const findEmojiIndex = (
    text: string
  ): { index: number; emoji: string } | null => {
    let earliestIndex = -1;
    let foundEmoji = "";
    emojiSet.forEach((emoji) => {
      const index = text.indexOf(emoji);
      if (index !== -1 && (earliestIndex === -1 || index < earliestIndex)) {
        earliestIndex = index;
        foundEmoji = emoji;
      }
    });
    return earliestIndex !== -1
      ? { index: earliestIndex, emoji: foundEmoji }
      : null;
  };

  const findHashtagIndex = (
    text: string
  ): { index: number; hashtag: string } | null => {
    let earliestIndex = -1;
    let foundHashtag = "";
    hashtagSet.forEach((hashtag) => {
      const lowerCaseText = text.toLowerCase();
      const index = lowerCaseText.indexOf(hashtag);

      if (index !== -1 && (earliestIndex === -1 || index < earliestIndex)) {
        earliestIndex = index;
        // 元のテキストから一致部分を取得
        foundHashtag = text.slice(index, index + hashtag.length);
        // console.log(foundHashtag);
      }
    });
    return earliestIndex !== -1
      ? { index: earliestIndex, hashtag: foundHashtag }
      : null;
  };

  while (remainingText.length > 0) {
    const numberMatch = remainingText.match(numberRegex);
    const nip19Match = remainingText.match(nip19Regex);
    const urlMatch = remainingText.match(urlRegex);
    const emojiResult = findEmojiIndex(remainingText);
    const hashtagResult = findHashtagIndex(remainingText);
    const nipMatch = remainingText.match(nipRegex);
    const relayMatch = remainingText.match(relayRegex);
    const invoiceMatch = remainingText.match(invoiceRegex);

    const numberIndex = numberMatch
      ? remainingText.indexOf(numberMatch[0])
      : -1;
    const nip19Index = nip19Match ? remainingText.indexOf(nip19Match[0]) : -1;
    const urlIndex = urlMatch ? remainingText.indexOf(urlMatch[0]) : -1;
    const emojiIndex = emojiResult ? emojiResult.index : -1;
    const hashtagIndex = hashtagResult ? hashtagResult.index : -1;
    const nipIndex = nipMatch ? remainingText.indexOf(nipMatch[0]) : -1;
    const relayIndex = relayMatch ? remainingText.indexOf(relayMatch[0]) : -1;
    const invoiceIndex = invoiceMatch
      ? remainingText.indexOf(invoiceMatch[0])
      : -1;
    if (
      numberIndex === -1 &&
      nip19Index === -1 &&
      urlIndex === -1 &&
      emojiIndex === -1 &&
      hashtagIndex === -1 &&
      nipIndex === -1 &&
      relayIndex === -1 &&
      invoiceIndex === -1
    ) {
      // No more matches, add the remaining text as a normal text part
      parts.push({ type: "text", content: remainingText });
      break;
    }

    const earliestMatch = [
      { type: "number", index: numberIndex, match: numberMatch },
      { type: "nip19", index: nip19Index, match: nip19Match },
      { type: "url", index: urlIndex, match: urlMatch },
      {
        type: "emoji",
        index: emojiIndex,
        match: emojiResult ? [emojiResult.emoji] : null,
      },
      {
        type: "hashtag",
        index: hashtagIndex,
        match: hashtagResult ? [hashtagResult.hashtag] : null,
      },
      { type: "nip", index: nipIndex, match: nipMatch },
      { type: "relay", index: relayIndex, match: relayMatch },
      { type: "invoice", index: invoiceIndex, match: invoiceMatch },
    ]
      .filter(({ index }) => index !== -1)
      .sort((a, b) => a.index - b.index)[0];

    const { type, index, match } = earliestMatch;

    if (index > 0) {
      parts.push({ type: "text", content: remainingText.slice(0, index) });
    }
    if (match) {
      switch (type) {
        case "number":
          parts.push({
            type: "nip19",
            content: match[0],
            url: numberQuoteEncode(match[0], tags),
          }); // Remove "nostr:" prefix
          break;
        case "nip19":
          parts.push({
            type: "nip19",
            content: match[0],
            url: match[0].slice(6),
          }); // Remove "nostr:" prefix
          break;
        case "url":
          const url = match[0];
          let lastUnpairedParenIndex = url.split("").reduce(
            (acc, char, idx) => {
              if (char === "(") acc.openParenCount++;
              if (char === ")") acc.closeParenCount++;
              if (
                acc.closeParenCount > acc.openParenCount &&
                acc.index === url.length
              ) {
                acc.index = idx;
              }
              return acc;
            },
            { openParenCount: 0, closeParenCount: 0, index: url.length }
          ).index;
          if (lastUnpairedParenIndex === url.length) {
            //()のぺあなし
            //（）のペアを探してみる
            lastUnpairedParenIndex = url.split("").reduce(
              (acc, char, idx) => {
                if (char === "（") acc.openParenCount++;
                if (char === "）") acc.closeParenCount++;
                if (
                  acc.closeParenCount > acc.openParenCount &&
                  acc.index === url.length
                ) {
                  acc.index = idx;
                }
                return acc;
              },
              { openParenCount: 0, closeParenCount: 0, index: url.length }
            ).index;
          }
          // Split the URL into its proper parts
          const urlPart = url.slice(0, lastUnpairedParenIndex);
          const textPart = url.slice(lastUnpairedParenIndex);
          parts.push({
            type: "url",
            content: urlPart,
            url: urlPart,
            number: mediaNum,
          });
          if (textPart) {
            parts.push({
              type: "text",
              content: textPart,
            });
          }

          break;
        case "emoji":
          const emojiContent = match[0].slice(1, -1); // Remove surrounding colons
          const matchingTag = tags.find(
            (tag) => tag[0] === "emoji" && tag[1] === emojiContent
          );
          parts.push({
            type: "emoji",
            url: matchingTag ? matchingTag[2] : undefined,
            content: emojiContent,
          });
          break;
        case "hashtag":
          parts.push({
            type: "hashtag",
            content: match[0].slice(1),
            url: match[0].slice(1).toLowerCase(),
          }); // Remove leading '#'
          break;
        case "nip":
          parts.push({
            type: "nip",
            content: match[0],
            url: `https://github.com/nostr-protocol/nips/blob/master/${match?.[0].slice(
              4
            )}.md`, // Remove "nip-" prefix
          });
          break;
        case "relay":
          parts.push({
            type: "relay",
            content: match[0],
            url: `/relay/${encodeURIComponent(match[0])}`,
          });
          break;
        case "invoice":
          parts.push({
            type: "invoice",
            content: match[0],
          });
          break;
      }

      remainingText = remainingText.slice(
        index + (match as RegExpMatchArray)[0].length
      );
    }
  }

  return parts;
}

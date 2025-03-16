import { nip19 } from "nostr-tools";
import { parseNaddr } from "./util";
import {
  nip19Regex,
  urlRegex,
  nipRegex,
  relayRegex,
  invoiceRegex,
} from "./regex";

// インターフェース定義
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

// 引用関連の定数と関数
export const numberRegex = /(#\[\d+\])/i;

export const numberQuoteEncode = (text: string, tags: string[][]): string => {
  try {
    const num = parseInt(text.slice(2, -1));
    const tag = tags[num];
    if (!tag) return "";

    switch (tag[0]) {
      case "e":
        return nip19.noteEncode(tag[1]);
      case "a":
        return nip19.naddrEncode(parseNaddr(tag));
      case "p":
        return nip19.npubEncode(tag[1]);
      default:
        return "";
    }
  } catch (error) {
    return "";
  }
};

// テキスト解析のヘルパー関数
interface IndexResult<T> {
  index: number;
  item: T;
}

const findEarliestMatch = <T>(
  text: string,
  items: T[],
  matchFn: (item: T, text: string) => number
): IndexResult<T> | null => {
  let earliestIndex = -1;
  let foundItem: T | null = null;

  for (const item of items) {
    const index = matchFn(item, text);
    if (index !== -1 && (earliestIndex === -1 || index < earliestIndex)) {
      earliestIndex = index;
      foundItem = item;
    }
  }

  return earliestIndex !== -1 && foundItem
    ? { index: earliestIndex, item: foundItem }
    : null;
};

// URLの括弧チェック用関数
const findLastUnpairedParenIndex = (
  url: string,
  openChar: string,
  closeChar: string
): number => {
  return url.split("").reduce(
    (acc, char, idx) => {
      if (char === openChar) acc.openCount++;
      if (char === closeChar) acc.closeCount++;
      if (acc.closeCount > acc.openCount && acc.index === url.length) {
        acc.index = idx;
      }
      return acc;
    },
    { openCount: 0, closeCount: 0, index: url.length }
  ).index;
};

// メインのテキスト解析関数
export async function parseText(
  input: string,
  tags: string[][]
): Promise<Part[]> {
  const parts: Part[] = [];
  let remainingText = input;
  let mediaNum = 0;

  // タグからデータセットを作成
  const emojiSet: string[] = tags
    .filter((tag) => tag[0] === "emoji")
    .map((tag) => `:${tag[1]}:`)
    .sort((a, b) => b.length - a.length);

  const hashtagSet: string[] = Array.from(
    new Set(
      tags
        .filter((tag) => tag[0] === "t")
        .map((tag) => `#${tag[1].toLowerCase()}`)
    )
  ).sort((a, b) => b.length - a.length);

  while (remainingText.length > 0) {
    // 全ての種類のマッチを探す
    const matches = [
      {
        type: "number",
        match: remainingText.match(numberRegex),
        process: (m: RegExpMatchArray) => ({
          type: "nip19" as const,
          content: m[0],
          url: numberQuoteEncode(m[0], tags),
        }),
      },
      {
        type: "nip19",
        match: remainingText.match(nip19Regex),
        process: (m: RegExpMatchArray) => ({
          type: "nip19" as const,
          content: m[0],
          url: m[0].slice(6), // "nostr:" プレフィックスを削除
        }),
      },
      {
        type: "url",
        match: remainingText.match(urlRegex),
        process: (m: RegExpMatchArray) => {
          const url = m[0];
          // 括弧のペアをチェック
          let lastUnpairedParenIndex = findLastUnpairedParenIndex(
            url,
            "(",
            ")"
          );
          if (lastUnpairedParenIndex === url.length) {
            // 日本語の括弧もチェック
            lastUnpairedParenIndex = findLastUnpairedParenIndex(
              url,
              "（",
              "）"
            );
          }

          const urlPart = url.slice(0, lastUnpairedParenIndex);
          const textPart = url.slice(lastUnpairedParenIndex);

          const result: Part[] = [
            {
              type: "url",
              content: urlPart,
              url: urlPart,
              number: mediaNum++,
            },
          ];

          if (textPart) {
            result.push({
              type: "text",
              content: textPart,
            });
          }

          return result;
        },
      },
      {
        type: "emoji",
        match: findEarliestMatch(remainingText, emojiSet, (emoji, text) =>
          text.indexOf(emoji)
        ),
        process: (match: IndexResult<string>) => {
          const emojiContent = match.item.slice(1, -1); // コロンを削除
          const matchingTag = tags.find(
            (tag) => tag[0] === "emoji" && tag[1] === emojiContent
          );
          return {
            type: "emoji" as const,
            url: matchingTag?.[2],
            content: emojiContent,
          };
        },
      },
      {
        type: "hashtag",
        match: findEarliestMatch(
          remainingText.toLowerCase(),
          hashtagSet,
          (hashtag, text) => text.indexOf(hashtag)
        ),
        process: (match: IndexResult<string>) => {
          const originalHashtag = remainingText.slice(
            match.index,
            match.index + match.item.length
          );
          return {
            type: "hashtag" as const,
            content: originalHashtag.slice(1), // #を削除
            url: originalHashtag.slice(1).toLowerCase(),
          };
        },
      },
      {
        type: "nip",
        match: remainingText.match(nipRegex),
        process: (m: RegExpMatchArray) => ({
          type: "nip" as const,
          content: m[0],
          url: `https://github.com/nostr-protocol/nips/blob/master/${m[0].slice(
            4
          )}.md`, // "nip-" プレフィックスを削除
        }),
      },
      {
        type: "relay",
        match: remainingText.match(relayRegex),
        process: (m: RegExpMatchArray) => ({
          type: "relay" as const,
          content: m[0],
          url: `/relay/${encodeURIComponent(m[0])}`,
        }),
      },
      {
        type: "invoice",
        match: remainingText.match(invoiceRegex),
        process: (m: RegExpMatchArray) => ({
          type: "invoice" as const,
          content: m[0],
        }),
      },
    ];

    // マッチした項目と位置を取得
    const validMatches = matches
      .map((match) => {
        if (!match.match) return null;

        const index =
          match.match instanceof Array
            ? remainingText.indexOf(match.match[0])
            : match.match.index;

        return {
          type: match.type,
          index,
          match: match.match,
          process: match.process,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);

    // マッチが無ければ残りのテキストを追加して終了
    if (validMatches.length === 0) {
      parts.push({ type: "text", content: remainingText });
      break;
    }

    // 最も早い位置にあるマッチを選択
    const earliestMatch = validMatches.sort((a, b) => a.index - b.index)[0];
    const { type, index, match, process } = earliestMatch;

    // マッチの前にテキストがあれば追加
    if (index > 0) {
      parts.push({ type: "text", content: remainingText.slice(0, index) });
    }

    // マッチした部分を処理
    const processedParts = process(match as any);
    if (Array.isArray(processedParts)) {
      parts.push(...processedParts);
    } else {
      parts.push(processedParts);
    }

    // 処理済みの部分をスキップ
    const matchLength =
      match instanceof Array ? match[0].length : match.item.length;
    remainingText = remainingText.slice(index + matchLength);
  }

  return parts;
}

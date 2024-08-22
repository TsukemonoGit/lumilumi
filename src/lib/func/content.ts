import { nip19Regex, urlRegex, nipRegex } from "./util";

export interface Part {
  type:
    | "nip19"
    | "url"
    | "emoji"
    | "hashtag"
    | "nip"
    | "text"
    | "image"
    | "audio"
    | "movie";
  content: string | undefined;
  url?: string;
  number?: number;
}
/** ImageFile_Check_正規表現_パターン */
const imageRegex = /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i;
//movie
const movieRegex = /\.(avi|mp4|mov|wmv|flv|mpg)$/i;

const audioRegex = /\.(mp3|wav|ogg|m4a)$/i;

// パスから拡張子をチェックする関数
const checkFileExtension = (url: string): Part["type"] => {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    if (imageRegex.test(path)) {
      return "image";
    } else if (movieRegex.test(path)) {
      return "movie";
    } else if (audioRegex.test(path)) {
      return "audio";
    } else {
      return "url";
    }
  } catch (error) {
    return "text";
  }
};

export function parseText(input: string, tags: string[][]): Part[] {
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
    const nip19Match = remainingText.match(nip19Regex);
    const urlMatch = remainingText.match(urlRegex);
    const emojiResult = findEmojiIndex(remainingText);
    const hashtagResult = findHashtagIndex(remainingText);
    const nipMatch = remainingText.match(nipRegex);

    const nip19Index = nip19Match ? remainingText.indexOf(nip19Match[0]) : -1;
    const urlIndex = urlMatch ? remainingText.indexOf(urlMatch[0]) : -1;
    const emojiIndex = emojiResult ? emojiResult.index : -1;
    const hashtagIndex = hashtagResult ? hashtagResult.index : -1;
    const nipIndex = nipMatch ? remainingText.indexOf(nipMatch[0]) : -1;

    if (
      nip19Index === -1 &&
      urlIndex === -1 &&
      emojiIndex === -1 &&
      hashtagIndex === -1 &&
      nipIndex === -1
    ) {
      // No more matches, add the remaining text as a normal text part
      parts.push({ type: "text", content: remainingText });
      break;
    }

    const earliestMatch = [
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
    ]
      .filter(({ index }) => index !== -1)
      .sort((a, b) => a.index - b.index)[0];

    const { type, index, match } = earliestMatch;

    if (index > 0) {
      parts.push({ type: "text", content: remainingText.slice(0, index) });
    }
    if (match) {
      switch (type) {
        case "nip19":
          parts.push({
            type: "nip19",
            content: match[0],
            url: match[0].slice(6),
          }); // Remove "nostr:" prefix
          break;
        case "url":
          const url = match[0];
          const lastUnpairedParenIndex = url.split("").reduce(
            (acc, char, index) => {
              if (char === "(") acc.openParenCount++;
              if (char === ")") acc.closeParenCount++;
              if (
                acc.closeParenCount > acc.openParenCount &&
                acc.index === url.length
              ) {
                acc.index = index;
              }
              return acc;
            },
            { openParenCount: 0, closeParenCount: 0, index: url.length }
          ).index;

          // If there's an unpaired closing parenthesis, split the URL and text
          const { urlPart, textPart } =
            lastUnpairedParenIndex < url.length
              ? {
                  urlPart: url.slice(0, lastUnpairedParenIndex),
                  textPart: url.slice(lastUnpairedParenIndex),
                }
              : { urlPart: url, textPart: undefined };

          const urlType = checkFileExtension(urlPart);
          if (
            urlType === "image"
            //||
            // urlType === "audio" ||
            //  urlType === "movie"
          ) {
            parts.push({
              type: urlType,
              content: urlPart,
              number: mediaNum,
            });
            mediaNum++;
          } else {
            parts.push({
              type: urlType,
              content: urlPart,
            });
          }

          if (textPart) {
            parts.push({
              type: "text",
              content: urlPart,
            });
          }
          // if (lastUnpairedParenIndex < url.length) {
          //   parts.push({
          //     type: "url",
          //     content: url.slice(0, lastUnpairedParenIndex),
          //   });
          //   parts.push({
          //     type: "text",
          //     content: url.slice(lastUnpairedParenIndex),
          //   });
          // } else {
          //   parts.push({ type: "url", content: url });
          // }
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
      }

      remainingText = remainingText.slice(
        index + (match as RegExpMatchArray)[0].length
      );
    }
  }

  return parts;
}

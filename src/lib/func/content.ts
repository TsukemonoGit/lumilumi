import { nip19Regex, urlRegex, emojiRegex } from "./util";

export function parseText(
  input: string,
  tags: string[][]
): {
  type: string;
  content: string | undefined;
  url?: string;
}[] {
  const parts = [];
  let remainingText = input;

  // Create emoji regex from tags
  const emojiTags = tags
    .filter((tag) => tag[0] === "emoji")
    .map((tag) => `:${tag[1]}:`);

  const hashTags = tags
    .filter((tag) => tag[0] === "t")
    .map((tag) => `#${tag[1]}`);

  const emojiRegex =
    emojiTags.length > 0
      ? new RegExp(`(${emojiTags.join("|")})`, "g")
      : new RegExp(`(?!x)x`); // Regex that matches nothing

  const hashtagRegex =
    hashTags.length > 0
      ? new RegExp(`(${hashTags.join("|")})`, "g")
      : new RegExp(`(?!x)x`); // Regex that matches nothing

  while (remainingText.length > 0) {
    const nip19Match = remainingText.match(nip19Regex);
    const urlMatch = remainingText.match(urlRegex);
    const emojiMatch = remainingText.match(emojiRegex);
    const hashtagMatch = remainingText.match(hashtagRegex);

    const nip19Index = nip19Match ? remainingText.indexOf(nip19Match[0]) : -1;
    const urlIndex = urlMatch ? remainingText.indexOf(urlMatch[0]) : -1;
    const emojiIndex = emojiMatch ? remainingText.indexOf(emojiMatch[0]) : -1;
    const hashtagIndex = hashtagMatch
      ? remainingText.indexOf(hashtagMatch[0])
      : -1;

    if (
      nip19Index === -1 &&
      urlIndex === -1 &&
      emojiIndex === -1 &&
      hashtagIndex === -1
    ) {
      // No more matches, add the remaining text as a normal text part
      parts.push({ type: "text", content: remainingText });
      break;
    }

    if (
      nip19Index !== -1 &&
      (urlIndex === -1 || nip19Index < urlIndex) &&
      (emojiIndex === -1 || nip19Index < emojiIndex) &&
      (hashtagIndex === -1 || nip19Index < hashtagIndex)
    ) {
      // nip19 match is earlier
      if (nip19Index > 0) {
        parts.push({
          type: "text",
          content: remainingText.slice(0, nip19Index),
        });
      }
      // Push the matched part without "nostr:" prefix
      parts.push({ type: "nip19", content: nip19Match?.[0].slice(6) });
      remainingText = remainingText.slice(
        nip19Index + (nip19Match as RegExpMatchArray)[0].length
      );
    } else if (
      urlIndex !== -1 &&
      (nip19Index === -1 || urlIndex < nip19Index) &&
      (emojiIndex === -1 || urlIndex < emojiIndex) &&
      (hashtagIndex === -1 || urlIndex < hashtagIndex)
    ) {
      // URL match is earlier
      if (urlIndex > 0) {
        parts.push({ type: "text", content: remainingText.slice(0, urlIndex) });
      }
      parts.push({ type: "url", content: urlMatch?.[0] });
      remainingText = remainingText.slice(
        urlIndex + (urlMatch as RegExpMatchArray)?.[0].length
      );
    } else if (
      emojiIndex !== -1 &&
      (nip19Index === -1 || emojiIndex < nip19Index) &&
      (urlIndex === -1 || emojiIndex < urlIndex) &&
      (hashtagIndex === -1 || emojiIndex < hashtagIndex)
    ) {
      // Emoji match is earlier
      if (emojiIndex > 0) {
        parts.push({
          type: "text",
          content: remainingText.slice(0, emojiIndex),
        });
      }
      const emojiContent = emojiMatch?.[0].slice(1, -1); // Remove surrounding colons
      const matchingTag = tags.find(
        (tag) => tag[0] === "emoji" && tag[1] === emojiContent
      );
      if (matchingTag) {
        parts.push({
          type: "emoji",
          url: matchingTag ? matchingTag[2] : undefined,
          content: emojiContent,
        });
      } else {
        parts.push({
          type: "text",
          content: emojiMatch?.[0],
        });
      }
      remainingText = remainingText.slice(
        emojiIndex + (emojiMatch as RegExpMatchArray)[0].length
      );
    } else if (
      hashtagIndex !== -1 &&
      (nip19Index === -1 || hashtagIndex < nip19Index) &&
      (urlIndex === -1 || hashtagIndex < urlIndex) &&
      (emojiIndex === -1 || hashtagIndex < emojiIndex)
    ) {
      // Hashtag match is earlier
      if (hashtagIndex > 0) {
        parts.push({
          type: "text",
          content: remainingText.slice(0, hashtagIndex),
        });
      }
      parts.push({
        type: "hashtag",
        content: hashtagMatch?.[0].slice(1), // Remove leading '#'
      });
      remainingText = remainingText.slice(
        hashtagIndex + (hashtagMatch as RegExpMatchArray)[0].length
      );
    }
  }

  return parts;
}

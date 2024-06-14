const nip19Regex =
  /nostr:(((npub|nsec|nprofile|naddr|nevent|note)1[023456789acdefghjklmnpqrstuvwxyz]{58,})|(nrelay1[023456789acdefghjklmnpqrstuvwxyz]{20,}))/;

const urlRegex = /(https?:\/\/+[^\s"'<`\]]+[^\s"'<`:\].]+)/;
const emojiRegex = /(:[^:\s]+:)/;
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
  let match;

  while (remainingText.length > 0) {
    const nip19Match = remainingText.match(nip19Regex);
    const urlMatch = remainingText.match(urlRegex);
    const emojiMatch = remainingText.match(emojiRegex);

    const nip19Index = nip19Match ? remainingText.indexOf(nip19Match[0]) : -1;
    const urlIndex = urlMatch ? remainingText.indexOf(urlMatch[0]) : -1;
    const emojiIndex = emojiMatch ? remainingText.indexOf(emojiMatch[0]) : -1;

    if (nip19Index === -1 && urlIndex === -1 && emojiIndex === -1) {
      // No more matches, add the remaining text as a normal text part
      parts.push({ type: "text", content: remainingText });
      break;
    }

    if (
      nip19Index !== -1 &&
      (urlIndex === -1 || nip19Index < urlIndex) &&
      (emojiIndex === -1 || nip19Index < emojiIndex)
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
      (emojiIndex === -1 || urlIndex < emojiIndex)
    ) {
      // URL match is earlier
      if (urlIndex > 0) {
        parts.push({ type: "text", content: remainingText.slice(0, urlIndex) });
      }
      parts.push({ type: "url", content: urlMatch?.[0] });
      remainingText = remainingText.slice(
        urlIndex + (urlMatch as RegExpMatchArray)[0]?.length
      );
    } else {
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
    }
  }

  return parts;
}

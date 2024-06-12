const nip19Regex =
  /nostr:(((npub|nsec|nprofile|naddr|nevent|note)1[023456789acdefghjklmnpqrstuvwxyz]{58,})|(nrelay1[023456789acdefghjklmnpqrstuvwxyz]{20,}))/;

const urlRegex = /(https?:\/\/+[^\s"'<`\]]+[^\s"'<`:\].]+)/;

export function parseText(input: string, tag: string[][]) {
  const parts = [];
  let remainingText = input;
  let match;

  while (remainingText.length > 0) {
    const nip19Match = remainingText.match(nip19Regex);
    const urlMatch = remainingText.match(urlRegex);

    const nip19Index = nip19Match ? remainingText.indexOf(nip19Match[0]) : -1;
    const urlIndex = urlMatch ? remainingText.indexOf(urlMatch[0]) : -1;

    if (nip19Index === -1 && urlIndex === -1) {
      // No more matches, add the remaining text as a normal text part
      parts.push({ type: "text", content: remainingText });
      break;
    }

    if (nip19Index !== -1 && (urlIndex === -1 || nip19Index < urlIndex)) {
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
    } else {
      // URL match is earlier
      if (urlIndex > 0) {
        parts.push({ type: "text", content: remainingText.slice(0, urlIndex) });
      }
      parts.push({ type: "url", content: urlMatch?.[0] });
      remainingText = remainingText.slice(
        urlIndex + (urlMatch as RegExpMatchArray)[0]?.length
      );
    }
  }

  return parts;
}

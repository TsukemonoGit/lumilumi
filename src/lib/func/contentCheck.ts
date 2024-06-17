import { nip19 } from "nostr-tools";
import { hashtagRegex, nip19Regex, urlRegex } from "./util";

export function contentCheck(
  text: string,
  tags: string[][]
): { text: string; tags: string[][] } {
  let newTags = [...tags];

  // Process NIP-19 matches

  const nip19Matches = text.matchAll(nip19Regex);
  [...nip19Matches].map((match) => {
    try {
      let decoded = nip19.decode(match[1]);
      switch (decoded.type) {
        case "nprofile":
          if (decoded.data.relays) {
            newTags.push(["p", decoded.data.pubkey, decoded.data.relays[0]]);
          } else {
            newTags.push(["p", decoded.data.pubkey]);
          }
          break;
        case "nrelay":
          newTags.push(["r", decoded.data]);
          break;
        case "nevent":
          if (decoded.data.relays) {
            newTags.push(["q", decoded.data.id, decoded.data.relays[0]]);
          } else {
            newTags.push(["q", decoded.data.id]);
          }
          break;
        case "naddr":
          if (decoded.data.relays) {
            newTags.push([
              "a",
              `${decoded.data.kind}:${decoded.data.pubkey}:${decoded.data.identifier}`,
              decoded.data.relays[0],
            ]);
          } else {
            newTags.push([
              "a",
              `${decoded.data.kind}:${decoded.data.pubkey}:${decoded.data.identifier}`,
            ]);
          }
          break;
        case "nsec":
          break;
        case "npub":
          newTags.push(["p", decoded.data]);
          break;
        case "note":
          newTags.push(["q", decoded.data]);
          break;
      }
    } catch (error) {
      console.error("Failed to decode NIP-19 identifier:", match[1]);
    }
  });

  // Process URL matches
  const urlMatches = text.matchAll(urlRegex);
  const urls = [...urlMatches].map((match) => ["r", match[0]]);
  newTags.push(...Array.from(new Set(urls)));

  //hashtag
  const hashtagMatches = text.matchAll(hashtagRegex);
  const hashtags = [...hashtagMatches]
    .map((match) => ["t", match.groups?.hashtag])
    .filter((x): x is string[] => x !== undefined);
  newTags.push(...Array.from(new Set(hashtags)));

  return { text, tags: newTags };
}

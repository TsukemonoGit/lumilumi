import * as Nostr from "nostr-typedef";
import { hexRegex, nip33Regex } from "./regex";
import * as nip19 from "nostr-tools/nip19";
import { parseNaddr } from "./util";

export function getStatusLink(
  event: Nostr.Event,
  origin: string
): string | undefined {
  //userURL
  const raeTags = event.tags.find(
    (tag) => tag[0] === "r" || tag[0] === "e" || tag[0] === "a"
  );
  if (raeTags && raeTags.length >= 2) {
    if (raeTags[0] === "r") {
      return raeTags[1];
    } else if (raeTags[0] === "e" && hexRegex.test(raeTags[1])) {
      return `${origin}/${nip19.noteEncode(raeTags[1])}`;
    } else if (raeTags[0] === "a" && nip33Regex.test(raeTags[1])) {
      return `${origin}/${nip19.naddrEncode(parseNaddr(raeTags))}`;
    }
  }
}

import * as Nostr from "nostr-typedef";

export function toGlobalRelaySet(value: Nostr.Event): string[] {
  return value.tags
    .filter((tag: string[]) => tag[0] === "relay" && tag.length > 1)
    .map((tag: any[]) => tag[1]);
}

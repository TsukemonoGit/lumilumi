import { nip19 } from "nostr-tools";
import * as Nostr from "nostr-typedef";

export function getChannelLink(heyaId: string | undefined): string {
  if (!heyaId) return "";
  try {
    return `/channel/${nip19.noteEncode(heyaId)}`;
  } catch (error) {
    return "";
  }
}

export function getHeyaRelays(event: Nostr.Event): string[] {
  try {
    const content = JSON.parse(event.content);
    const relays = content.relays;
    if (relays && relays.length > 0) {
      return relays;
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
}

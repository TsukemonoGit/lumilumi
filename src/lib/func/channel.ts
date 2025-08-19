import { nip19 } from "nostr-tools";

export function getChannelLink(heyaId: string | undefined): string {
  if (!heyaId) return "";
  try {
    return `/channel/${nip19.noteEncode(heyaId)}`;
  } catch (error) {
    return "";
  }
}

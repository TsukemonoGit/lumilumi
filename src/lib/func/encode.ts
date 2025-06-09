import * as nip19 from "nostr-tools/nip19";

export function encodetoNote(str: string): string {
  try {
    return nip19.noteEncode(str);
  } catch (error) {
    return str;
  }
}

export function encodetoNpub(str: string): string {
  try {
    return nip19.npubEncode(str);
  } catch (error) {
    return str;
  }
}

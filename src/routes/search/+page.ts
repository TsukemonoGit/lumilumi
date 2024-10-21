import { ogDescription } from "$lib/stores/stores";
import { nip19 } from "nostr-tools";
import type { PageLoad } from "./$types";

export const load: PageLoad = ({ url }) => {
  const searchParams = url.searchParams;

  const searchWord = searchParams.get("word") || "";
  const searchKind = searchParams.get("k")
    ? parseInt(searchParams.get("k")!)
    : undefined;
  const searchPubkey = searchParams.get("author") || "";
  const searchHashtag = searchParams.get("t") || undefined;
  const searchSince = searchParams.get("s")
    ? parseInt(searchParams.get("s")!)
    : undefined;
  const searchUntil = searchParams.get("u")
    ? parseInt(searchParams.get("u")!)
    : undefined;
  const searchPubkeyTo = searchParams.get("p") || "";
  const followee = searchParams.get("f") === "true";

  let desc = "Search";
  if (searchWord) {
    desc = desc + `\nward:${searchWord}`;
  }
  if (searchHashtag) {
    desc = desc + `\nhashtag:${searchHashtag}`;
  }
  if (searchKind) {
    desc = desc + `\nkind:${searchKind}`;
  }
  if (searchPubkey) {
    desc = desc + `\nfrom:${nip19.npubEncode(searchPubkey)}`;
  }
  if (searchPubkeyTo) {
    desc = desc + `\nto:${nip19.npubEncode(searchPubkeyTo)}`;
  }
  ogDescription.set(desc);

  return {
    searchWord,
    searchKind,
    searchPubkey,
    searchHashtag,
    searchSince,
    searchUntil,
    searchPubkeyTo,
    followee,
  };
};

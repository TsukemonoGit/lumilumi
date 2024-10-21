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

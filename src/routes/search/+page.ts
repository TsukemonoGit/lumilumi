import { parseSearchInput } from "$lib/func/SearchQueryParser";
import { ogDescription, ogTitle } from "$lib/stores/stores";

import type { PageLoad } from "./$types";

export const load: PageLoad = ({ url }) => {
  const searchParams = url.searchParams;

  // 新しい形式のパラメータをチェック
  const qParam = searchParams.get("q");
  const followeeParam = searchParams.get("followee");
  const excludeProxyParam = searchParams.get("excludeProxy");
  const loadParam = searchParams.get("load");

  // 古い形式のパラメータをチェック
  const oldSearchWord = searchParams.get("word") || "";
  const oldSearchKind = searchParams.get("k")
    ? parseInt(searchParams.get("k")!)
    : undefined;
  const oldSearchPubkey = searchParams.get("author") || "";
  const oldSearchHashtag = searchParams.get("t") || "";
  const oldSearchSince = searchParams.get("s")
    ? parseInt(searchParams.get("s")!)
    : undefined;
  const oldSearchUntil = searchParams.get("u")
    ? parseInt(searchParams.get("u")!)
    : undefined;
  const oldSearchPubkeyTo = searchParams.get("p") || "";
  const oldFollowee = searchParams.get("f") === "true";

  let searchWord = "";
  let followee = false;
  let excludeProxy = false;
  let shouldLoad = true;

  // 新しい形式が存在するかチェック
  if (qParam) {
    // 新しい形式を使用
    searchWord = qParam;
    followee = followeeParam === "1" || followeeParam === "true";
    excludeProxy = excludeProxyParam === "1" || excludeProxyParam === "true";
    shouldLoad = !(loadParam && (loadParam === "0" || loadParam === "false"));
  } else if (hasOldParams(searchParams)) {
    // 古い形式を新しい形式に変換
    searchWord = convertOldToNewFormat({
      word: oldSearchWord,
      kind: oldSearchKind,
      author: oldSearchPubkey,
      hashtag: oldSearchHashtag,
      since: oldSearchSince,
      until: oldSearchUntil,
      pubkeyTo: oldSearchPubkeyTo,
    });
    followee = oldFollowee;
    excludeProxy = false;
    shouldLoad = true;
  }

  // OGメタデータの設定
  let desc = "Search";
  if (searchWord) {
    // 新しい形式の場合はパース結果を使用してメタデータを生成
    const parsed = parseSearchInput(searchWord);
    if (parsed.search) desc += `\nword:${parsed.search}`;
    if (parsed.kinds) desc += `\nkind:${parsed.kinds.join(",")}`;
    if (parsed.authors) desc += `\nfrom:${parsed.authors.join(",")}`;
    if (parsed.tags?.t) desc += `\n#${parsed.tags.t.join(",")}`;
    if (parsed.tags?.p) desc += `\nto:${parsed.tags.p.join(",")}`;
  }

  ogTitle.set("Lumilumi - Search");
  ogDescription.set(desc);

  return {
    searchWord,
    followee,
    excludeProxy,
    shouldLoad,
    // 後方互換性のため古い形式のパラメータも返す
    searchKind: oldSearchKind,
    searchPubkey: oldSearchPubkey,
    searchHashtag: oldSearchHashtag,
    searchSince: oldSearchSince,
    searchUntil: oldSearchUntil,
    searchPubkeyTo: oldSearchPubkeyTo,
  };
};

function hasOldParams(searchParams: URLSearchParams): boolean {
  return !!(
    searchParams.get("word") ||
    searchParams.get("k") ||
    searchParams.get("author") ||
    searchParams.get("t") ||
    searchParams.get("s") ||
    searchParams.get("u") ||
    searchParams.get("p") ||
    searchParams.get("f")
  );
}

interface OldSearchParams {
  word: string;
  kind?: number;
  author: string;
  hashtag: string;
  since?: number;
  until?: number;
  pubkeyTo: string;
}

function convertOldToNewFormat(params: OldSearchParams): string {
  const parts: string[] = [];

  // 基本的な検索ワード
  if (params.word) {
    parts.push(params.word);
  }

  // 種類
  if (params.kind !== undefined) {
    parts.push(`kind:${params.kind}`);
  }

  // 作成者
  if (params.author) {
    parts.push(`author:${params.author}`);
  }

  // ハッシュタグ
  if (params.hashtag) {
    parts.push(`#${params.hashtag}`);
  }

  // メンション先
  if (params.pubkeyTo) {
    parts.push(`p:${params.pubkeyTo}`);
  }

  // 時間範囲（untilのみサポート、sinceは新しい形式では直接サポートされていない）
  if (params.until !== undefined) {
    const date = new Date(params.until * 1000);
    parts.push(`until:${date.toISOString()}`);
  }

  return parts.join(" ");
}

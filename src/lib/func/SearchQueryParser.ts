import * as nip19 from "nostr-tools/nip19";
import type * as Nostr from "nostr-typedef";

export interface ParsedSearch {
  search?: string;
  authors?: string[];
  kinds?: number[];
  ids?: string[];
  tags?: Record<string, string[]>;
  //  since?: number;
  until?: number;
}

export function parseSearchInput(input: string): ParsedSearch {
  if (!input?.trim()) return {};

  const result: ParsedSearch = {};
  let remainingInput = input.trim();

  // プロパティ:値 の正規表現を修正（スペース区切りを考慮）
  const propertyPattern = /(\w+):((?:"[^"]*"|[^\s]+))/g;

  // #hashtag の正規表現
  const hashtagPattern = /#(\w+)/g;

  // すべてのマッチを先に取得
  const matches = [];
  let match;
  while ((match = propertyPattern.exec(input)) !== null) {
    matches.push({
      fullMatch: match[0],
      property: match[1],
      value: match[2].replace(/^"|"$/g, ""), // クォート除去
    });
  }

  // マッチした部分を文字列から削除
  for (const matchItem of matches) {
    remainingInput = remainingInput.replace(matchItem.fullMatch, "").trim();
  }

  // プロパティごとに処理
  for (const matchItem of matches) {
    const { property, value } = matchItem;

    switch (property.toLowerCase()) {
      case "author":
      case "authors": {
        const authors = parseMultiValue(value)
          .map((v) => convertToHex(v))
          .filter((v) => v.length > 0);

        if (authors.length > 0) {
          if (!result.authors) result.authors = [];
          result.authors.push(...authors);
        }
        break;
      }

      case "kind":
      case "kinds":
        const kinds = parseMultiValue(value)
          .map((v) => parseInt(v, 10))
          .filter((v) => !isNaN(v) && v >= 0);
        if (kinds.length > 0) {
          result.kinds = kinds;
        }
        break;

      case "id":
      case "ids":
        const ids = parseMultiValue(value)
          .map((v) => convertToHex(v))
          .filter((v) => v.length > 0);
        if (ids.length > 0) {
          result.ids = ids;
        }
        break;

      /* case "since":
        const sinceTime = parseDateTime(value);
        if (sinceTime) result.since = sinceTime;
        break; */

      case "until":
        const untilTime = parseDateTime(value);
        if (untilTime) result.until = untilTime;
        break;

      case "t":
      case "tag":
      case "hashtag":
        const tagValues = parseMultiValue(value);
        if (tagValues.length > 0) {
          if (!result.tags) result.tags = {};
          if (!result.tags["t"]) result.tags["t"] = [];
          result.tags["t"].push(...tagValues);
        }
        break;

      case "p":
      case "mention":
        const mentions = parseMultiValue(value)
          .map((v) => convertToHex(v))
          .filter((v) => v.length > 0);
        if (mentions.length > 0) {
          if (!result.tags) result.tags = {};
          if (!result.tags["p"]) result.tags["p"] = [];
          result.tags["p"].push(...mentions);
        }
        break;

      case "r":
      case "url":
      case "link":
        const urls = parseMultiValue(value);
        if (urls.length > 0) {
          if (!result.tags) result.tags = {};
          if (!result.tags["r"]) result.tags["r"] = [];
          result.tags["r"].push(...urls);
        }
        break;

      default:
        // その他のタグとして処理（1文字のタグのみ）
        if (property.length === 1) {
          const customTagValues = parseMultiValue(value);
          if (customTagValues.length > 0) {
            if (!result.tags) result.tags = {};
            if (!result.tags[property]) result.tags[property] = [];
            result.tags[property].push(...customTagValues);
          }
        }
        break;
    }
  }

  // #hashtag の解析（すべてのハッシュタグを処理）
  hashtagPattern.lastIndex = 0;
  const hashtags: string[] = [];
  let hashtagMatch;
  // 全てのマッチを先に取得
  const hashtagMatches = [];
  while ((hashtagMatch = hashtagPattern.exec(remainingInput)) !== null) {
    hashtagMatches.push({
      fullMatch: hashtagMatch[0],
      hashtag: hashtagMatch[1],
    });
  }

  // 全てのハッシュタグを配列に追加し、文字列から削除
  for (const match of hashtagMatches) {
    hashtags.push(match.hashtag);
    remainingInput = remainingInput.replace(match.fullMatch, "").trim();
  }

  if (hashtags.length > 0) {
    if (!result.tags) result.tags = {};
    if (!result.tags["t"]) result.tags["t"] = [];
    result.tags["t"].push(...hashtags);
  }

  // 残りのテキストをsearchプロパティに設定
  if (remainingInput.trim()) {
    result.search = remainingInput.trim();
  }

  return result;
}

function parseMultiValue(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function parseDateTime(dateStr: string): number | undefined {
  try {
    // ISO 8601形式やタイムスタンプをサポート
    if (/^\d+$/.test(dateStr)) {
      // Unix timestamp
      const timestamp = parseInt(dateStr, 10);
      return timestamp > 1000000000 ? timestamp : timestamp * 1000;
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return undefined;
    return Math.floor(date.getTime() / 1000);
  } catch {
    return undefined;
  }
}

function convertToHex(value: string): string {
  if (!value) return "";

  // bech32形式の場合の変換処理
  if (value.match(/^(npub|note|naddr|nevent|nprofile)1[02-9ac-hj-np-z]+$/)) {
    try {
      const decoded = nip19.decode(value);
      switch (decoded.type) {
        case "note":
        case "npub":
          return decoded.data;
        case "nevent":
          return decoded.data.id;
        case "nprofile":
          return decoded.data.pubkey;
        case "naddr":
          return `${decoded.data.kind}:${decoded.data.pubkey}:${decoded.data.identifier}`;
        default:
          return "";
      }
    } catch (error) {
      return "";
    }
  }

  // hex形式の検証
  if (/^[0-9a-fA-F]{64}$/.test(value)) {
    return value.toLowerCase();
  }

  // 短いhex形式も許可
  if (/^[0-9a-fA-F]+$/.test(value) && value.length >= 8) {
    return value.toLowerCase();
  }

  return "";
}

export function toNostrFilter(parsed: ParsedSearch): Nostr.Filter {
  const filter: any = {};

  if (parsed.search) filter.search = parsed.search;
  if (parsed.authors && parsed.authors.length > 0)
    filter.authors = parsed.authors;
  if (parsed.kinds && parsed.kinds.length > 0) filter.kinds = parsed.kinds;
  if (parsed.ids && parsed.ids.length > 0) filter.ids = parsed.ids;
  // if (parsed.since) filter.since = parsed.since;
  if (parsed.until) filter.until = parsed.until;

  // タグの処理
  if (parsed.tags) {
    Object.entries(parsed.tags).forEach(([key, values]) => {
      if (values && values.length > 0) {
        filter[`#${key}`] = values;
      }
    });
  }

  return filter;
}

export function formatSearchQuery(filter: Nostr.Filter): string {
  const parts: string[] = [];

  // search text (最初に配置)
  if (filter.search) {
    parts.push(filter.search);
  }

  // authors
  if (filter.authors && filter.authors.length > 0) {
    const npubs = filter.authors.map((hex) => {
      try {
        return nip19.npubEncode(hex);
      } catch {
        return hex;
      }
    });
    parts.push(`authors:${npubs.join(",")}`);
  }

  // kinds
  if (filter.kinds && filter.kinds.length > 0) {
    parts.push(`kinds:${filter.kinds.join(",")}`);
  }

  // ids
  if (filter.ids && filter.ids.length > 0) {
    const noteIds = filter.ids.map((hex) => {
      try {
        return nip19.noteEncode(hex);
      } catch {
        return hex;
      }
    });
    parts.push(`ids:${noteIds.join(",")}`);
  }

  // since/until
  //   if (filter.since) {
  //     const date = new Date(filter.since * 1000);
  //     parts.push(`since:${date.toISOString()}`);
  //   }

  if (filter.until) {
    const date = new Date(filter.until * 1000);
    parts.push(`until:${date.toISOString()}`);
  }

  // tags
  Object.entries(filter).forEach(([key, value]) => {
    if (key.startsWith("#") && Array.isArray(value) && value.length > 0) {
      const tagKey = key.substring(1);
      if (tagKey === "t") {
        // ハッシュタグは #形式で表示
        parts.push(...(value as string[]).map((v) => `#${v}`));
      } else if (tagKey === "p") {
        // メンションはnpub形式で表示
        const npubs = (value as string[]).map((hex) => {
          try {
            return nip19.npubEncode(hex);
          } catch {
            return hex;
          }
        });
        parts.push(`p:${npubs.join(",")}`);
      } else {
        parts.push(`${tagKey}:${(value as string[]).join(",")}`);
      }
    }
  });

  return parts.join(" ");
}

// デバッグ用のヘルパー
export function debugParseSearch(input: string): void {
  console.log(`入力: "${input}"`);
  const parsed = parseSearchInput(input);
  console.log("パース結果:", JSON.stringify(parsed, null, 2));
  const filter = toNostrFilter(parsed);
  console.log("Nostrフィルター:", JSON.stringify(filter, null, 2));
  const formatted = formatSearchQuery(filter);
  console.log(`復元クエリ: "${formatted}"`);
  console.log("---");
}

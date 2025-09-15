import * as nip19 from "nostr-tools/nip19";
import type * as Nostr from "nostr-typedef";

export interface ParsedSearch {
  search?: string;
  authors?: string[];
  kinds?: number[];
  ids?: string[];
  tags?: Record<string, string[]>;
  until?: number;
}

interface PropertyMatch {
  fullMatch: string;
  property: string;
  value: string;
}

interface HashtagMatch {
  fullMatch: string;
  hashtag: string;
}

const PROPERTY_PATTERN = /(\w+):((?:"[^"]*"|[^\s]+))/g;
const HASHTAG_PATTERN = /#(\w+)/g;
const HEX_64_PATTERN = /^[0-9a-fA-F]{64}$/;
const HEX_MIN_PATTERN = /^[0-9a-fA-F]+$/;
const BECH32_PATTERN = /^(npub|note|naddr|nevent|nprofile)1[02-9ac-hj-np-z]+$/;
const TIMESTAMP_PATTERN = /^\d+$/;

export function parseSearchInput(input: string): ParsedSearch {
  if (!input?.trim()) return {};

  const result: ParsedSearch = {};
  let remainingInput = input.trim();

  const propertyMatches = extractPropertyMatches(input);
  remainingInput = removeMatchesFromInput(remainingInput, propertyMatches);

  processPropertyMatches(propertyMatches, result);

  const hashtagMatches = extractHashtagMatches(remainingInput);
  remainingInput = removeMatchesFromInput(remainingInput, hashtagMatches);
  processHashtagMatches(hashtagMatches, result);

  if (remainingInput.trim()) {
    result.search = remainingInput.trim();
  }

  return result;
}

function extractPropertyMatches(input: string): PropertyMatch[] {
  const matches: PropertyMatch[] = [];
  let match: RegExpExecArray | null;

  while ((match = PROPERTY_PATTERN.exec(input)) !== null) {
    matches.push({
      fullMatch: match[0],
      property: match[1],
      value: removeQuotes(match[2]),
    });
  }

  return matches;
}

function extractHashtagMatches(input: string): HashtagMatch[] {
  const matches: HashtagMatch[] = [];
  let match: RegExpExecArray | null;

  HASHTAG_PATTERN.lastIndex = 0;
  while ((match = HASHTAG_PATTERN.exec(input)) !== null) {
    matches.push({
      fullMatch: match[0],
      hashtag: match[1],
    });
  }

  return matches;
}

function removeMatchesFromInput(
  input: string,
  matches: Array<{ fullMatch: string }>
): string {
  let result = input;
  for (const match of matches) {
    result = result.replace(match.fullMatch, "").trim();
  }
  return result;
}

function removeQuotes(value: string): string {
  return value.replace(/^"|"$/g, "");
}

function parseMultiValue(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function processPropertyMatches(
  matches: PropertyMatch[],
  result: ParsedSearch
): void {
  for (const { property, value } of matches) {
    const propertyLower = property.toLowerCase();

    switch (propertyLower) {
      case "author":
      case "authors":
        processAuthors(value, result);
        break;
      case "kind":
      case "kinds":
        processKinds(value, result);
        break;
      case "id":
      case "ids":
        processIds(value, result);
        break;
      case "until":
        processUntil(value, result);
        break;
      case "t":
      case "tag":
      case "hashtag":
        processTagValues(value, result, "t");
        break;
      case "p":
      case "mention":
        processMentions(value, result);
        break;
      case "r":
      case "url":
      case "link":
        processTagValues(value, result, "r");
        break;
      default:
        if (property.length === 1) {
          processCustomTag(property, value, result);
        }
        break;
    }
  }
}

function processAuthors(value: string, result: ParsedSearch): void {
  const authors = parseMultiValue(value)
    .map((v) => convertToHex(v))
    .filter((v) => v.length > 0);

  if (authors.length > 0) {
    if (!result.authors) result.authors = [];
    result.authors.push(...authors);
  }
}

function processKinds(value: string, result: ParsedSearch): void {
  const kinds = parseMultiValue(value)
    .map((v) => parseInt(v, 10))
    .filter((v) => !isNaN(v) && v >= 0);

  if (kinds.length > 0) {
    if (!result.kinds) result.kinds = [];
    result.kinds.push(...kinds);
  }
}

function processIds(value: string, result: ParsedSearch): void {
  const ids = parseMultiValue(value)
    .map((v) => convertToHex(v))
    .filter((v) => v.length > 0);

  if (ids.length > 0) {
    result.ids = ids;
  }
}

function processUntil(value: string, result: ParsedSearch): void {
  const untilTime = parseDateTime(value);
  if (untilTime) {
    result.until = untilTime;
  }
}

function processTagValues(
  value: string,
  result: ParsedSearch,
  tagKey: string
): void {
  const tagValues = parseMultiValue(value);
  if (tagValues.length > 0) {
    initializeTags(result);
    if (!result.tags![tagKey]) result.tags![tagKey] = [];
    result.tags![tagKey].push(...tagValues);
  }
}

function processMentions(value: string, result: ParsedSearch): void {
  const mentions = parseMultiValue(value)
    .map((v) => convertToHex(v))
    .filter((v) => v.length > 0);

  if (mentions.length > 0) {
    initializeTags(result);
    if (!result.tags!["p"]) result.tags!["p"] = [];
    result.tags!["p"].push(...mentions);
  }
}

function processCustomTag(
  property: string,
  value: string,
  result: ParsedSearch
): void {
  const customTagValues = parseMultiValue(value).map(
    (v) => convertToHexForTag(property, v) || v
  );

  if (customTagValues.length > 0) {
    initializeTags(result);
    if (!result.tags![property]) result.tags![property] = [];
    result.tags![property].push(...customTagValues);
  }
}

function processHashtagMatches(
  matches: HashtagMatch[],
  result: ParsedSearch
): void {
  const hashtags = matches.map((match) => match.hashtag);

  if (hashtags.length > 0) {
    initializeTags(result);
    if (!result.tags!["t"]) result.tags!["t"] = [];
    result.tags!["t"].push(...hashtags);
  }
}

function initializeTags(result: ParsedSearch): void {
  if (!result.tags) {
    result.tags = {};
  }
}

function parseDateTime(dateStr: string): number | undefined {
  try {
    // タイムスタンプが10桁（秒単位）または13桁（ミリ秒単位）かチェック
    if (TIMESTAMP_PATTERN.test(dateStr)) {
      const timestamp = parseInt(dateStr, 10);

      // 10桁のUnix時間（秒）であればそのまま返す
      if (timestamp.toString().length === 10) {
        return timestamp;
      }
    }

    // 時間指定がない日付文字列をUTCで解釈させるために'T00:00'を追加
    const date = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00`);

    // getTime()でミリ秒単位のUnix Timeを取得し、1000で割って秒単位にする
    return isNaN(date.getTime())
      ? undefined
      : Math.floor(date.getTime() / 1000);
  } catch {
    return undefined;
  }
}

function convertToHex(value: string): string {
  if (!value) return "";

  if (BECH32_PATTERN.test(value)) {
    return convertBech32ToHex(value);
  }

  if (HEX_64_PATTERN.test(value)) {
    return value.toLowerCase();
  }

  if (HEX_MIN_PATTERN.test(value) && value.length >= 8) {
    return value.toLowerCase();
  }

  return "";
}

function convertBech32ToHex(value: string): string {
  try {
    const decoded = nip19.decode(value);
    switch (decoded.type) {
      case "note":
      case "npub":
        return decoded.data as string;
      case "nevent":
        return (decoded.data as any).id;
      case "nprofile":
        return (decoded.data as any).pubkey;
      case "naddr":
        const addrData = decoded.data as any;
        return `${addrData.kind}:${addrData.pubkey}:${addrData.identifier}`;
      default:
        return "";
    }
  } catch {
    return "";
  }
}

function convertToHexForTag(property: string, value: string): string {
  if (!value) return "";

  if (BECH32_PATTERN.test(value)) {
    return convertBech32ToHexForTag(property, value);
  }

  if (HEX_64_PATTERN.test(value)) return value.toLowerCase();
  if (HEX_MIN_PATTERN.test(value) && value.length >= 8)
    return value.toLowerCase();

  return "";
}

function convertBech32ToHexForTag(property: string, value: string): string {
  try {
    const decoded = nip19.decode(value);
    switch (decoded.type) {
      case "note":
      case "npub":
        return decoded.data as string;
      case "nevent":
        if (property === "e" || property === "q") {
          return (decoded.data as any).id;
        }
        return "";
      case "nprofile":
        if (property === "p" || property === "authors") {
          return (decoded.data as any).pubkey;
        }
        return "";
      case "naddr":
        const addrData = decoded.data as any;
        return `${addrData.kind}:${addrData.pubkey}:${addrData.identifier}`;
      default:
        return "";
    }
  } catch {
    return "";
  }
}

export function toNostrFilter(parsed: ParsedSearch): Nostr.Filter {
  const filter: Record<string, any> = {};

  if (parsed.search) filter.search = parsed.search;
  if (parsed.authors?.length) filter.authors = parsed.authors;
  if (parsed.kinds?.length) filter.kinds = parsed.kinds;
  if (parsed.ids?.length) filter.ids = parsed.ids;
  if (parsed.until) filter.until = parsed.until;

  if (parsed.tags) {
    for (const [key, values] of Object.entries(parsed.tags)) {
      if (values?.length) {
        filter[`#${key}`] = values;
      }
    }
  }

  return filter as Nostr.Filter;
}

export function formatSearchQuery(filter: Nostr.Filter): string {
  const parts: string[] = [];

  if (filter.search) {
    parts.push(filter.search);
  }

  addAuthorsPart(filter, parts);
  addKindsPart(filter, parts);
  addIdsPart(filter, parts);
  addUntilPart(filter, parts);
  addTagParts(filter, parts);

  return parts.join(" ");
}

function addAuthorsPart(filter: Nostr.Filter, parts: string[]): void {
  if (filter.authors?.length) {
    const npubs = filter.authors.map((hex) => {
      try {
        return nip19.npubEncode(hex);
      } catch {
        return hex;
      }
    });
    parts.push(`authors:${npubs.join(",")}`);
  }
}

function addKindsPart(filter: Nostr.Filter, parts: string[]): void {
  if (filter.kinds?.length) {
    parts.push(`kinds:${filter.kinds.join(",")}`);
  }
}

function addIdsPart(filter: Nostr.Filter, parts: string[]): void {
  if (filter.ids?.length) {
    const noteIds = filter.ids.map((hex) => {
      try {
        return nip19.noteEncode(hex);
      } catch {
        return hex;
      }
    });
    parts.push(`ids:${noteIds.join(",")}`);
  }
}

function addUntilPart(filter: Nostr.Filter, parts: string[]): void {
  if (filter.until) {
    const date = new Date(filter.until * 1000);
    parts.push(`until:${date.toISOString()}`);
  }
}

function addTagParts(filter: Nostr.Filter, parts: string[]): void {
  for (const [key, value] of Object.entries(filter)) {
    if (key.startsWith("#") && Array.isArray(value) && value.length > 0) {
      const tagKey = key.substring(1);
      addSpecificTagPart(tagKey, value, parts);
    }
  }
}

function addSpecificTagPart(
  tagKey: string,
  value: string[] | number[],
  parts: string[]
): void {
  const stringValues = Array.isArray(value) ? value.map((v) => String(v)) : [];

  if (tagKey === "t") {
    parts.push(...stringValues.map((v) => `#${v}`));
  } else if (tagKey === "p") {
    const npubs = stringValues.map((hex) => {
      try {
        return nip19.npubEncode(hex);
      } catch {
        return hex;
      }
    });
    parts.push(`p:${npubs.join(",")}`);
  } else {
    parts.push(`${tagKey}:${stringValues.join(",")}`);
  }
}

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

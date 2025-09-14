import { describe, test, expect } from "vitest";
import {
  parseSearchInput,
  toNostrFilter,
  formatSearchQuery,
  type ParsedSearch,
} from "./SearchQueryParser";
import * as nip19 from "nostr-tools/nip19";

describe("parseSearchInput", () => {
  test("空文字列の処理", () => {
    expect(parseSearchInput("")).toEqual({});
    expect(parseSearchInput("   ")).toEqual({});
  });

  test("単純な検索テキスト", () => {
    const result = parseSearchInput("hello world");
    expect(result).toEqual({
      search: "hello world",
    });
  });

  test("authors パース", () => {
    const hex =
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const npub = nip19.npubEncode(hex);

    expect(parseSearchInput(`authors:${hex}`)).toEqual({
      authors: [hex],
    });

    expect(parseSearchInput(`authors:${npub}`)).toEqual({
      authors: [hex],
    });

    expect(parseSearchInput(`authors:${hex},${npub}`)).toEqual({
      authors: [hex, hex],
    });
  });

  test("kinds パース", () => {
    expect(parseSearchInput("kinds:1")).toEqual({
      kinds: [1],
    });

    expect(parseSearchInput("kinds:1,30023,6")).toEqual({
      kinds: [1, 30023, 6],
    });

    expect(parseSearchInput("kinds:invalid")).toEqual({});
  });

  test("ids パース", () => {
    const hex =
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const note = nip19.noteEncode(hex);

    expect(parseSearchInput(`ids:${hex}`)).toEqual({
      ids: [hex],
    });

    expect(parseSearchInput(`ids:${note}`)).toEqual({
      ids: [hex],
    });
  });

  test("時刻パース", () => {
    const timestamp = 1640995200; // 2022-01-01 00:00:00 UTC

    expect(parseSearchInput(`until:${timestamp}`)).toEqual({
      until: timestamp,
    });

    expect(parseSearchInput("until:2022-01-01T00:00:00.000Z")).toEqual({
      until: timestamp,
    });

    expect(parseSearchInput("until:2022-12-31T23:59:59.000Z")).toEqual({
      until: 1672531199,
    });
  });

  test("ハッシュタグパース", () => {
    expect(parseSearchInput("#bitcoin")).toEqual({
      tags: { t: ["bitcoin"] },
    });

    expect(parseSearchInput("#bitcoin #nostr")).toEqual({
      tags: { t: ["bitcoin", "nostr"] },
    });

    expect(parseSearchInput("t:bitcoin")).toEqual({
      tags: { t: ["bitcoin"] },
    });

    expect(parseSearchInput("tag:bitcoin,nostr")).toEqual({
      tags: { t: ["bitcoin", "nostr"] },
    });
  });

  test("メンションパース", () => {
    const hex =
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const npub = nip19.npubEncode(hex);

    expect(parseSearchInput(`p:${npub}`)).toEqual({
      tags: { p: [hex] },
    });

    expect(parseSearchInput(`mention:${hex},${npub}`)).toEqual({
      tags: { p: [hex, hex] },
    });
  });

  test("URLタグパース", () => {
    expect(parseSearchInput("r:https://example.com")).toEqual({
      tags: { r: ["https://example.com"] },
    });

    expect(
      parseSearchInput("url:https://example.com,https://test.com")
    ).toEqual({
      tags: { r: ["https://example.com", "https://test.com"] },
    });
  });

  test("複合クエリパース", () => {
    const hex =
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const input = `bitcoin research authors:${hex} kinds:1,30023 #nostr until:1640995200`;

    const result = parseSearchInput(input);
    expect(result).toEqual({
      search: "bitcoin research",
      authors: [hex],
      kinds: [1, 30023],
      tags: { t: ["nostr"] },
      until: 1640995200,
    });
  });

  test("クォート付き値", () => {
    expect(parseSearchInput('authors:"npub1234567890abcdef"')).toEqual({});

    expect(parseSearchInput('tag:"hello world"')).toEqual({
      tags: { t: ["hello world"] },
    });
  });

  test("無効な値の処理", () => {
    expect(parseSearchInput("authors:invalid")).toEqual({});
    expect(parseSearchInput("kinds:abc")).toEqual({});
    expect(parseSearchInput("until:invalid")).toEqual({});
  });

  test("短いhex値の処理", () => {
    expect(parseSearchInput("authors:12345678")).toEqual({
      authors: ["12345678"],
    });

    expect(parseSearchInput("authors:1234567")).toEqual({});
  });
});

describe("toNostrFilter", () => {
  test("基本的な変換", () => {
    const parsed: ParsedSearch = {
      search: "bitcoin",
      authors: ["abc123"],
      kinds: [1, 30023],
      tags: { t: ["nostr"], p: ["def456"] },
      until: 1640995200,
    };

    const filter = toNostrFilter(parsed);
    expect(filter).toEqual({
      search: "bitcoin",
      authors: ["abc123"],
      kinds: [1, 30023],
      "#t": ["nostr"],
      "#p": ["def456"],
      until: 1640995200,
    });
  });

  test("空のタグ配列を除外", () => {
    const parsed: ParsedSearch = {
      tags: { t: [] },
    };

    const filter = toNostrFilter(parsed);
    expect(filter).toEqual({});
  });
});

describe("formatSearchQuery", () => {
  test("基本的なフォーマット", () => {
    const hex =
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const npub = nip19.npubEncode(hex);
    const noteId = nip19.noteEncode(hex);

    const filter = {
      search: "bitcoin research",
      authors: [hex],
      kinds: [1, 30023],
      ids: [hex],
      "#t": ["nostr", "bitcoin"],
      "#p": [hex],
      "#r": ["https://example.com"],
      until: 1640995200,
    };

    const result = formatSearchQuery(filter);
    expect(result).toContain("bitcoin research");
    expect(result).toContain(`authors:${npub}`);
    expect(result).toContain("kinds:1,30023");
    expect(result).toContain(`ids:${noteId}`);
    expect(result).toContain("#nostr");
    expect(result).toContain("#bitcoin");
    expect(result).toContain(`p:${npub}`);
    expect(result).toContain("r:https://example.com");
    expect(result).toContain("until:2022-01-01T00:00:00.000Z");
  });

  test("無効なhex値の処理", () => {
    const filter = {
      authors: ["invalid_hex"],
      "#p": ["invalid_hex"],
    };

    const result = formatSearchQuery(filter);
    expect(result).toContain("authors:invalid_hex");
    expect(result).toContain("p:invalid_hex");
  });
});

describe("往復変換テスト", () => {
  test("パース→フィルタ→フォーマットの整合性", () => {
    const hex =
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const originalInput = `bitcoin research authors:${hex} kinds:1 #nostr`;

    const parsed = parseSearchInput(originalInput);
    const filter = toNostrFilter(parsed);
    const formatted = formatSearchQuery(filter);

    expect(formatted).toContain("bitcoin research");
    expect(formatted).toContain("kinds:1");
    expect(formatted).toContain("#nostr");
  });
});

describe("エラー処理", () => {
  test("nip19デコードエラー", () => {
    // 無効なbech32形式
    expect(parseSearchInput("authors:npub1invalid")).toEqual({});
    expect(parseSearchInput("ids:note1invalid")).toEqual({});
  });
});

describe("特殊ケース", () => {
  const testNpub =
    "npub1sjcvg64knxkrt6ev52rywzu9uzqakgy8ehhk8yezxmpewsthst6sw3jqcw";
  const testNevent =
    "nevent1qvzqqqqqqypzpp9sc34tdxdvxh4jeg5xgu9ctcypmvsg0n00vwfjydkrjaqh0qh4qyxhwumn8ghj77tpvf6jumt9qys8wumn8ghj7un9d3shjtt2wqhxummnw3ezuamfwfjkgmn9wshx5uqpzamhxue69uhkummnw3ezu6t5w3skumt09ekk2mspzemhxue69uhhyetvv9ujumn0wd68ytnzv9hxgqgawaehxw309ahx7um5wghxxmmdwp5kcefdv4e8ymmj9ehx2aqqyrxc4d6na92xc0zrpnqzz7hflssygr6n2tqk36jdnnnjkdygl23l6us2uwu";
  const testNaddr =
    "naddr1qvzqqqr4gupzpp9sc34tdxdvxh4jeg5xgu9ctcypmvsg0n00vwfjydkrjaqh0qh4qyxhwumn8ghj77tpvf6jumt9qywhwumn8ghj7mn0wd68ytnrdakhq6tvv5kk2unjdaezumn9wsqjqamnwvaz7tmjv4kxz7fddfczumn0wd68ytnhd9ex2erwv46zu6nsqyv8wumn8ghj7un9d3shjtnddakk7um5wgh8q6twdvq32amnwvaz7tmjv4kxz7fwvfshy6twv5hxxmcpz3mhxue69uhhyetvv9ujuerpd46hxtnfduq3wamnwvaz7tmwdaehgu3wd968gctwd4hjumt9dcq3zamnwvaz7tmwveex2mrp0yhxzursqyt8wumn8ghj7un9d3shjtnwdaehgu3wvfskueqqpfkk7mn0946x7mmvwvkwxkfp";
  const testNprofile =
    "nprofile1qqsgfvxyd2mfntp4avk29pj8pwz7pqwmyzrummmrjv3rdsuhg9mc9agyetfs4";

  test("nevent/nprofile/naddrの処理", () => {
    const neventDecoded = nip19.decode(testNevent);
    const expectedEventId =
      neventDecoded.type === "nevent" ? neventDecoded.data.id : "";

    const nprofileDecoded = nip19.decode(testNprofile);
    const expectedPubkey =
      nprofileDecoded.type === "nprofile" ? nprofileDecoded.data.pubkey : "";

    const naddrDecoded = nip19.decode(testNaddr);
    const expectedNaddr =
      naddrDecoded.type === "naddr"
        ? `${naddrDecoded.data.kind}:${naddrDecoded.data.pubkey}:${naddrDecoded.data.identifier}`
        : "";

    expect(parseSearchInput(`ids:${testNevent}`)).toEqual({
      ids: [expectedEventId],
    });

    expect(parseSearchInput(`authors:${testNprofile}`)).toEqual({
      authors: [expectedPubkey],
    });

    expect(parseSearchInput(`ids:${testNaddr}`)).toEqual({
      ids: [expectedNaddr],
    });
  });

  test("1文字タグの処理", () => {
    expect(parseSearchInput("e:value1,value2")).toEqual({
      tags: { e: ["value1", "value2"] },
    });

    expect(parseSearchInput("a:value")).toEqual({
      tags: { a: ["value"] },
    });
  });

  test("複数文字のカスタムプロパティは無視", () => {
    expect(parseSearchInput("custom:value")).toEqual({});
    expect(parseSearchInput("longproperty:value")).toEqual({});
  });

  test("Unix timestamp の秒/ミリ秒変換", () => {
    // 秒単位のタイムスタンプ（10桁）
    expect(parseSearchInput("until:1640995200")).toEqual({
      until: 1640995200,
    });

    // ミリ秒単位のタイムスタンプ（13桁）を秒に変換
    expect(parseSearchInput("until:1640995200000")).toEqual({
      until: 1640995200000,
    });

    // 小さな数値は1000倍される
    expect(parseSearchInput("until:100")).toEqual({
      until: 100000,
    });
  });
  test("複数のauthor", () => {
    const npub1 =
      "npub1sjcvg64knxkrt6ev52rywzu9uzqakgy8ehhk8yezxmpewsthst6sw3jqcw";
    const npub2 =
      "npub12egp0pvh2f0fp6sk5nt6ncehqzkz8zsma8dl8agf8p3f98v6resqku4w26";

    const decoded1 = nip19.decode(npub1);
    const decoded2 = nip19.decode(npub2);

    const pubkey1 = decoded1.type === "npub" ? decoded1.data : undefined;
    const pubkey2 = decoded2.type === "npub" ? decoded2.data : undefined;

    const input = `author:${npub1} author:${npub2}`;
    const result = parseSearchInput(input);

    expect(result).toEqual({
      authors: [pubkey1, pubkey2],
    });
  });
  test("nevent/q/e タグのデコード処理", () => {
    const testNevent =
      "nevent1qvzqqqqqqypzqmjxss3dld622uu8q25gywum9qtg4w4cv4064jmg20xsac2aam5nqyghwumn8ghj7mnxwfjkccte9eshquqpz3mhxue69uhhyetvv9ujuerpd46hxtnfduq3vamnwvaz7tmjv4kxz7fwdehhxarj9e3xzmnyqqstx5hnzj2d6n8yx693lcgrkhk707v723kmyl0tksmnr7q59prw8jsynhypv";
    const decoded = nip19.decode(testNevent);

    expect(parseSearchInput(`e:${testNevent}`)).toEqual({
      tags: { e: [decoded.data.id] },
    });

    expect(parseSearchInput(`q:${testNevent}`)).toEqual({
      tags: { q: [decoded.data.id] },
    });
  });

  test("t: の場合は変換しない", () => {
    const input = "t:abc123";
    expect(parseSearchInput(input)).toEqual({
      tags: { t: ["abc123"] },
    });
  });
});

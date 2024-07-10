// sum.test.js
import { expect, test } from "vitest";
import { contentCheck } from "./contentCheck";

test("", () => {
  const text =
    "nostr:npub12egp0pvh2f0fp6sk5nt6ncehqzkz8zsma8dl8agf8p3f98v6resqku4w26\n:nostopus_spin:";
  const tags = [
    ["emoji", "nostopus_spin", "https://awayuki.github.io/emoji/np-002.gif"],
  ];
  expect(contentCheck(text, tags)).toStrictEqual({
    text: "nostr:npub12egp0pvh2f0fp6sk5nt6ncehqzkz8zsma8dl8agf8p3f98v6resqku4w26\n:nostopus_spin:",
    tags: [
      ["emoji", "nostopus_spin", "https://awayuki.github.io/emoji/np-002.gif"],
      ["p", "5650178597525e90ea16a4d7a9e33700ac238a1be9dbf3f5093862929d9a1e60"],
    ],
  });
});
test("hashtag", () => {
  const text =
    "₍ #ᴗ# ₎ #test #てすと🌚 #＼(^o^)／ #te_st+-te #てｓつつぉえいとｊふぃじゃいが；えおいｈ #0-9　#٩(๑´0`๑)۶　#☆ミ";
  const tags: string[][] = [];
  expect(contentCheck(text, tags)).toStrictEqual({
    text: text,
    tags: [
      ["t", "test"],
      ["t", "てすと🌚"],
      ["t", "te_st+-te"],
      ["t", "てｓつつぉえいとｊふぃじゃいが；えおいｈ"],
      ["t", "0-9"],
      ["t", "٩(๑´0`๑)۶"],
    ],
  });
});
test("hashtag", () => {
  const text = "test";
  const tags: string[][] = [["emoji", "test", "url"]];
  expect(contentCheck(text, tags)).toStrictEqual({
    text: text,
    tags: [],
  });
});

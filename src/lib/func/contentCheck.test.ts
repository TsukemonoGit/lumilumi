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

test("imetatag", () => {
  const text = "";
  const tags: string[][] = [
    [
      "imeta",
      "url https://share.yabu.me/5650178597525e90ea16a4d7a9e33700ac238a1be9dbf3f5093862929d9a1e60/1a656f3d22d289ffaf7cc49f2e75b80fe7b47bc4e37bea9c3a26f7c485401a78.webp",
      "m image/webp",
      "x 24be783eb0e392b47cab57462dadabd9b5b9bf74f2378f76f5c0d76557673b54",
      "ox 1a656f3d22d289ffaf7cc49f2e75b80fe7b47bc4e37bea9c3a26f7c485401a78",
      "size 3132",
      "dim 128x128",
      "blurhash U78PY7.gD9VJM}VvxZWE04V[SzM#Xio^V]xp",
    ],
  ];
  expect(contentCheck(text, tags)).toStrictEqual({
    text: text,
    tags: [],
  });
});

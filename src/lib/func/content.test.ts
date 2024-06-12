// sum.test.js
import { expect, test } from "vitest";
import { parseText } from "./content";

test("", () => {
  const text =
    "test nostr:nevent1qqsxsn5qaa2t6r7cc65lz5yrkslg4q68egzl6lvpc8rzmzpkxl9yjxgvawjvr test https://nostr.com";
  const tags = [
    ["q", "684e80ef54bd0fd8c6a9f15083b43e8a8347ca05fd7d81c1c62d883637ca4919"],
  ];
  expect(parseText(text, tags));
});

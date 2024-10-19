import { test } from "vitest";
import { decodeGeohash } from "./event";
test("decodeGeohash", () => {
  const geohash = "xps4mhn85m55";
  const result = decodeGeohash(geohash);
  console.log(result);
});

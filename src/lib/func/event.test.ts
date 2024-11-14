import { test } from "vitest";
import { decodeGeohash } from "./geohash";
test("decodeGeohash", () => {
  const geohash = "xps4mhn85m55";
  const result = decodeGeohash(geohash);
  console.log(result);
});

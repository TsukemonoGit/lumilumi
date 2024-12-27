import { describe, it, expect, vi } from "vitest";
import { removeExif, uploadFile } from "./upload";
import fs from "fs";
import path from "path";

function readTestFile(filePath: string): File {
  const buffer = fs.readFileSync(filePath);
  const blob = new Blob([buffer], { type: "image/jpeg" });
  return new File([blob], path.basename(filePath), { type: "image/jpeg" });
}

describe("uploadFile", () => {
  it("should upload file and remove Exif data for jpg", async () => {
    const filePath = path.resolve(__dirname, "test.jpg");
    const file = readTestFile(filePath);

    const removed = await removeExif(file);

    fs.writeFileSync(
      "test_no_exif.jpg",
      Buffer.from(await removed.arrayBuffer())
    );
    console.log("Exifデータが削除されたファイルがダウンロードされました");
  });

  it("should upload file and remove Exif data for jpeg", async () => {
    const filePath = path.resolve(__dirname, "test-exif.jpeg");
    const file = readTestFile(filePath);

    const removed = await removeExif(file);

    fs.writeFileSync(
      "test_no_exif.jpeg",
      Buffer.from(await removed.arrayBuffer())
    );

    console.log("Exifデータが削除されたファイルがダウンロードされました");
  });
});

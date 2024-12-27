import { describe, it } from "vitest";
import { removeExif } from "./upload";
import fs from "fs";
import path from "path";

function readTestFile(filePath: string): File {
  const buffer = fs.readFileSync(filePath);
  const blob = new Blob([buffer], { type: "image/jpeg" });
  return new File([blob], path.basename(filePath), { type: "image/jpeg" });
}

function readTestPNGFile(filePath: string): File {
  const buffer = fs.readFileSync(filePath);
  const blob = new Blob([buffer], { type: "image/png" });
  return new File([blob], path.basename(filePath), { type: "image/png" });
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

  it("should upload file and remove metadata for png", async () => {
    const filePath = path.resolve(__dirname, "test.png");
    const file = readTestPNGFile(filePath);

    const removed = await removeExif(file);

    fs.writeFileSync(
      "test_no_metadata.png",
      Buffer.from(await removed.arrayBuffer())
    );
    console.log("メタデータが削除されたファイルがダウンロードされました");
  });
});

import type { RequestHandler } from "@sveltejs/kit";
import sharp from "sharp";

export const POST: RequestHandler = async ({ request }) => {
  // FormDataからファイルを取得
  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return new Response(JSON.stringify({ message: "File is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // sharpでEXIF情報を取得
  try {
    // ファイルをBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // EXIFデータが存在するか確認
    if (process.env.NODE_ENV === "development") {
      const image = sharp(buffer);
      const beforeMetadata = await image.metadata();

      if (beforeMetadata.exif) {
        console.log("Before EXIF data:", beforeMetadata.exif);
      } else {
        console.log("Before EXIF data not found");
      }
    }
    // sharpでEXIFを削除
    const imageWithoutExif = await sharp(buffer).toBuffer();

    // 画像形式を推測
    const afterMetadata = await sharp(imageWithoutExif).metadata();

    // EXIFデータが存在するか確認
    if (process.env.NODE_ENV === "development") {
      if (afterMetadata.exif) {
        console.log("After EXIF data:", afterMetadata.exif);
      } else {
        console.log("After EXIF data not found");
      }
    }

    const mimeType = afterMetadata.format
      ? `image/${afterMetadata.format}`
      : "application/octet-stream";

    // EXIFを削除した画像を返す
    return new Response(imageWithoutExif, {
      status: 200,
      headers: { "Content-Type": mimeType },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Error processing image" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

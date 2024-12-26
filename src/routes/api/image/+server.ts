import type { RequestHandler } from "@sveltejs/kit";
import sharp from "sharp";

// EXIFデータをログに出力する関数
const logExifData = async (image: sharp.Sharp, stage: string) => {
  const metadata = await image.metadata();
  if (process.env.NODE_ENV === "development") {
    if (metadata.exif) {
      console.log(`${stage} EXIF data:`, metadata.exif);
    } else {
      console.log(`${stage} EXIF data not found`);
    }
  }
  return metadata;
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    // FormDataからファイルを取得
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return new Response(JSON.stringify({ message: "File is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ファイルをBufferに変換
    const buffer = Buffer.from(await file.arrayBuffer());

    // sharpインスタンスの作成と回転情報適用
    const image = sharp(buffer).rotate();

    // 変換前のEXIFデータをログ出力
    await logExifData(image, "Before");

    // EXIFを削除した画像を生成
    const imageWithoutExif = await image.toBuffer();

    // 変換後のEXIFデータをログ出力
    const afterMetadata = await logExifData(sharp(imageWithoutExif), "After");

    // MIMEタイプを決定
    const mimeType = afterMetadata.format
      ? `image/${afterMetadata.format}`
      : "application/octet-stream";

    // EXIFを削除した画像を返す
    return new Response(imageWithoutExif, {
      status: 200,
      headers: { "Content-Type": mimeType },
    });
  } catch (error: any) {
    console.error("Error processing image:", error);
    return new Response(
      JSON.stringify({
        message: "Error processing image",
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

import {
  type FileUploadResponse,
  type OptionalFormDataFields,
} from "nostr-tools/nip96";

// エラーコードを定数として定義
const ERROR_CODES = {
  FILE_TOO_LARGE: 413,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  PAYMENT_REQUIRED: 402,
};

// エラーメッセージを定数として定義
const ERROR_MESSAGES = {
  [ERROR_CODES.FILE_TOO_LARGE]: "File too large!",
  [ERROR_CODES.BAD_REQUEST]: "Bad request! Some fields are missing or invalid!",
  [ERROR_CODES.FORBIDDEN]:
    "Forbidden! Payload tag does not match the requested file!",
  [ERROR_CODES.PAYMENT_REQUIRED]: "Payment required!",
  DEFAULT: "Unknown error in uploading file!",
};

// アップロード設定のインターフェース
interface UploadOptions {
  serverApiUrl: string;
  nip98AuthorizationHeader: string;
  optionalFormDataFields?: OptionalFormDataFields;
  signal?: AbortSignal;
  imageQuality?: number; // 画質設定（1-100）
  maxWaitTime?: number; // 最大待機時間（ミリ秒）
  onProcessed?: (
    originalSize: number,
    processedSize: number,
    quality: number
  ) => void; // 処理結果のコールバック
}

// 調整後の画像情報のインターフェース
interface ProcessedImageInfo {
  file: File;
  originalSize: number;
  processedSize: number;
  quality: number;
}

// エラーハンドリングを共通化
function handleErrorResponse(response: Response): never {
  const errorMessage =
    ERROR_MESSAGES[response.status] || ERROR_MESSAGES.DEFAULT;
  throw new Error(errorMessage);
}

// ファイルサイズをフォーマットする関数
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes + " B";
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + " KB";
  } else {
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }
}

// 画質調整機能
async function adjustImageQuality(
  file: File,
  quality: number
): Promise<ProcessedImageInfo> {
  // if (quality === 100) {
  //   return {
  //     file,
  //     originalSize: file.size,
  //     processedSize: file.size,
  //     quality: 100,
  //   };
  // }
  if (file.type === "image/jpeg" || file.type === "image/jpg") {
    // JPG処理
    return await processJpg(file, quality);
    // } else if (file.type === 'image/png') {
    //   // PNG専用処理
    //   return await processPng(file);
  } else {
    // その他のファイル形式はそのまま
    return {
      file,
      originalSize: file.size,
      processedSize: file.size,
      quality: 100,
    };
  }
}

async function processJpg(file: File, quality: number) {
  const originalSize = file.size;
  const boundedQuality = Math.max(1, Math.min(100, quality));
  const url = URL.createObjectURL(file);
  const img = new Image();

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });

  const arrayBuffer = await file.arrayBuffer();
  const orientation = readExifOrientation(arrayBuffer);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // 回転情報を考慮してキャンバスサイズを設定
  switch (orientation) {
    case 3:
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.rotate(Math.PI); // 180度回転
      ctx.translate(-canvas.width, -canvas.height);
      break;
    case 6:
      canvas.width = img.height;
      canvas.height = img.width;
      ctx.rotate(Math.PI / 2); // 90度回転
      ctx.translate(0, -canvas.width);
      break;
    case 8:
      canvas.width = img.height;
      canvas.height = img.width;
      ctx.rotate(-Math.PI / 2); // 270度回転
      ctx.translate(-canvas.height, 0);
      break;
    default:
      canvas.width = img.width;
      canvas.height = img.height;
  }

  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          resolve(new Blob([file], { type: file.type }));
        }
      },
      file.type,
      boundedQuality / 100
    );
  });

  const processedFile = new File([blob], file.name, { type: file.type });

  return {
    file: processedFile,
    originalSize,
    processedSize: processedFile.size,
    quality: boundedQuality,
  };
}

// プレビュー用のURLを生成する関数
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

// プレビューをクリーンアップする関数
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<FileUploadResponse> {
  const {
    serverApiUrl,
    nip98AuthorizationHeader,
    optionalFormDataFields,
    signal,
    imageQuality = 100, // デフォルトは100%（最高画質）
    maxWaitTime = 8000, // デフォルトは8秒
    onProcessed,
  } = options;
  const removeFile = await removeExif(file);
  // 画質調整を行う
  const processedImageInfo = await adjustImageQuality(removeFile, imageQuality);
  const processedFile = processedImageInfo.file;

  // コールバックがあれば実行
  if (onProcessed) {
    onProcessed(
      processedImageInfo.originalSize,
      processedImageInfo.processedSize,
      processedImageInfo.quality
    );
  }

  // // Exif情報を削除
  // processedFile = await removeExif(processedFile);

  const formData = new FormData();
  formData.append("Authorization", nip98AuthorizationHeader);

  // オプションフィールドを処理
  if (optionalFormDataFields) {
    Object.entries(optionalFormDataFields).forEach(([key, value]) => {
      if (value) {
        formData.append(key, value);
      }
    });
  }
  formData.append("file", processedFile);

  return pollUploadStatus(
    serverApiUrl,
    formData,
    nip98AuthorizationHeader,
    signal,
    maxWaitTime
  );
}

// 画質チェック機能 - ファイル処理するが実際にはアップロードしない
export async function checkImageQuality(
  file: File,
  quality: number
): Promise<ProcessedImageInfo> {
  const processedImageInfo = await adjustImageQuality(file, quality);
  return processedImageInfo;
}

// アップロード状態をポーリングする関数
async function pollUploadStatus(
  serverApiUrl: string,
  formData: FormData,
  authHeader: string,
  signal?: AbortSignal,
  maxWaitTime: number = 8000
): Promise<FileUploadResponse> {
  const startTime = Date.now();
  let response: Response;
  let statusResponse: FileUploadResponse;

  while (true) {
    response = await fetch(serverApiUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
      },
      body: formData,
      signal,
    });

    // レスポンスエラーチェック
    if (!response.ok) {
      handleErrorResponse(response);
    }

    try {
      statusResponse = await response.json();
    } catch (error) {
      throw new Error("Failed to parse status response");
    }

    // 初期レスポンスが201ならすぐに返す
    if (response.status === 201) {
      return statusResponse;
    }

    // 経過時間が最大待機時間を超えたら終了
    if (Date.now() - startTime > maxWaitTime) {
      return statusResponse;
    }

    // 進行状況が200または202の場合、1秒待機して再チェック
    if (response.status === 200 || response.status === 202) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }

    // それ以外の場合は、エラーを投げる
    throw new Error("Unexpected status code during file upload process!");
  }
}

export async function removeExif(file: File): Promise<File> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    if (file.type === "image/jpeg") {
      const cleanedFile = removeExifFromJPEG(arrayBuffer);
      return new File([cleanedFile], file.name, { type: file.type });
    } else if (file.type === "image/png") {
      const cleanedFile = removeMetadataFromPNG(arrayBuffer);
      return new File([cleanedFile], file.name, { type: file.type });
    }
  } catch (error) {
    console.error("Failed to remove Exif data:", error);
  }

  return file; // エラーが発生した場合や他の形式の場合、元のファイルを返す
}

function removeExifFromJPEG(data: ArrayBuffer): ArrayBuffer {
  const dataView = new DataView(data);
  let offset = 2; // JPEGは0xFFD8で始まるので、最初の2バイトをスキップ
  const length = data.byteLength;

  // JPEGは通常0xFFD8で始まり、0xFFD9で終わる
  // Exifデータは0xFFE1セグメントに格納されることが多い
  while (offset < length) {
    // JPEGセグメントの先頭は0xFFで始まるので、0xFF以外のバイトが出てきたら終了
    if (dataView.getUint8(offset) !== 0xff) break;

    // セグメントタイプを取得
    const segmentType = dataView.getUint8(offset + 1);

    // Exifセグメントの識別子（0xFFE1）
    if (segmentType === 0xe1) {
      const segmentLength = dataView.getUint16(offset + 2); // セグメントの長さ

      const newLength = length - segmentLength - 2; // Exifデータを削除した新しい長さ

      // 新しいArrayBufferの作成
      const newData = new ArrayBuffer(newLength);
      const newUint8Array = new Uint8Array(newData);

      // これまでのデータをコピー
      const beforeExif = new Uint8Array(data, 0, offset); // Exif前の部分
      const afterExif = new Uint8Array(
        data,
        offset + 2 + segmentLength,
        length - (offset + 2 + segmentLength)
      ); // Exif後の部分

      // 新しいArrayBufferにExif前とExif後のデータをコピー
      newUint8Array.set(beforeExif, 0); // Exif前
      newUint8Array.set(afterExif, beforeExif.length); // Exif後

      return newData; // Exifデータを削除した新しいArrayBufferを返す
    }

    // 次のセグメントへ移動
    const segmentLength = dataView.getUint16(offset + 2); // セグメントの長さ
    offset += 2 + segmentLength; // オフセットを次のセグメントに進める
  }

  return data; // Exifが見つからない場合、そのままのデータを返す
}

// PNGのメタデータ削除
export function removeMetadataFromPNG(arrayBuffer: ArrayBuffer): ArrayBuffer {
  const data = new Uint8Array(arrayBuffer);
  const pngSignature = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  // PNGシグネチャの検証
  if (!pngSignature.every((value, index) => data[index] === value)) {
    return arrayBuffer; // PNG形式でなければそのまま返す
  }

  const chunks: Uint8Array[] = [];
  let offset = 8; // 最初の8バイトはシグネチャ

  // 除外するチャンクタイプ
  const metadataChunks = ["tEXt", "iTXt", "zTXt", "gAMA", "pHYs"];

  while (offset < data.length) {
    const length = new DataView(data.buffer).getUint32(offset); // チャンク長
    const typeBytes = data.subarray(offset + 4, offset + 8);
    const type = String.fromCharCode(...typeBytes);

    // メタデータに関連するチャンクを除外
    if (!metadataChunks.includes(type)) {
      chunks.push(data.subarray(offset, offset + 12 + length)); // 長さ + タイプ + データ + CRC
    }

    offset += 12 + length; // チャンク長さ+12バイト(ヘッダ+CRC)
  }

  // 新しいバッファを作成
  const cleanedBuffer = new Uint8Array(
    pngSignature.byteLength +
      chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0)
  );
  cleanedBuffer.set(pngSignature, 0);

  let position = pngSignature.byteLength;
  for (const chunk of chunks) {
    cleanedBuffer.set(chunk, position);
    position += chunk.byteLength;
  }

  return cleanedBuffer.buffer;
}

function readExifOrientation(data: ArrayBuffer): number {
  const dataView = new DataView(data);
  let offset = 2; // JPEGのマーカー開始位置 (最初の2バイトはFFD8)
  const length = data.byteLength;

  while (offset < length) {
    if (dataView.getUint8(offset) !== 0xff) break;

    const marker = dataView.getUint8(offset + 1);
    if (marker === 0xe1) {
      // Exifセグメント (0xFFE1)
      const segmentLength = dataView.getUint16(offset + 2);
      const exifData = new DataView(data, offset + 4, segmentLength - 2);

      if (
        exifData.getUint32(0, false) === 0x45786966 && // 'Exif' マーカー
        exifData.getUint16(4, false) === 0x0000
      ) {
        let littleEndian = false;
        const tiffHeaderOffset = 6;
        if (exifData.getUint16(tiffHeaderOffset) === 0x4949) {
          littleEndian = true;
        }

        const ifdOffset = exifData.getUint32(
          tiffHeaderOffset + 4,
          littleEndian
        );
        const numEntries = exifData.getUint16(
          tiffHeaderOffset + ifdOffset,
          littleEndian
        );

        for (let i = 0; i < numEntries; i++) {
          const entryOffset = tiffHeaderOffset + ifdOffset + 2 + i * 12;
          const tag = exifData.getUint16(entryOffset, littleEndian);

          if (tag === 0x0112) {
            // Orientationタグ
            return exifData.getUint16(entryOffset + 8, littleEndian);
          }
        }
      }
    }

    offset += 2 + dataView.getUint16(offset + 2);
  }
  return 1; // デフォルト（回転なし）
}

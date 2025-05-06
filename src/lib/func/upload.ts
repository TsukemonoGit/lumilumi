import {
  type FileUploadResponse,
  type OptionalFormDataFields,
} from "nostr-tools/nip96";
import { getToken } from "nostr-tools/nip98";
import * as Nostr from "nostr-typedef";
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

export async function processJpg(file: File, quality: number) {
  const originalSize = file.size;
  const boundedQuality = Math.max(1, Math.min(100, quality));
  let url: string | null = null;

  try {
    // 壊れているかチェック
    const isCorrupted = await checkIfJpegIsCorrupted(file);
    if (isCorrupted) {
      console.warn("Corrupted JPEG detected. Returning original file.");
      return {
        file,
        originalSize,
        processedSize: originalSize,
        quality: 100,
        isCorrupted: true,
      };
    }

    // 画像読み込み
    url = URL.createObjectURL(file);
    const img = new Image();

    const { success, error } = await new Promise<{
      success: boolean;
      error?: any;
    }>((resolve) => {
      img.onload = () => resolve({ success: true });
      img.onerror = (e) => resolve({ success: false, error: e });

      const timeout = setTimeout(
        () => resolve({ success: false, error: "timeout" }),
        10000
      );
      img.addEventListener("load", () => clearTimeout(timeout));

      img.src = url!;
    });

    if (!success || img.width === 0 || img.height === 0) {
      console.warn("Failed to load image:", error ?? "invalid dimensions");
      return {
        file,
        originalSize,
        processedSize: originalSize,
        quality: 100,
        isCorrupted: true,
      };
    }

    // Canvas描画
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get 2D context from canvas.");
      return {
        file,
        originalSize,
        processedSize: originalSize,
        quality: 100,
        isCorrupted: true,
      };
    }

    try {
      //ctx.fillStyle = "#fff"; // 白背景
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const totalPixels = pixels.length / 4;

      if (checkIfMostlyBlack(pixels, totalPixels)) {
        console.warn("Random pixel sampling suggests image is fully black.");
        return {
          file,
          originalSize,
          processedSize: originalSize,
          quality: 100,
          isCorrupted: true,
        };
      }
    } catch (drawErr) {
      console.warn("drawImage failed:", drawErr);
      return {
        file,
        originalSize,
        processedSize: originalSize,
        quality: 100,
        isCorrupted: true,
      };
    }

    // toBlob で画質調整
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (result) => {
          if (result && result.size > 0) {
            resolve(result);
          } else {
            console.warn("Canvas toBlob returned invalid blob");
            resolve(new Blob([file], { type: file.type }));
          }
        },
        file.type,
        boundedQuality / 100
      );
    });

    if (blob.size === 0) {
      console.warn("Blob size is zero — fallback to original");
      return {
        file,
        originalSize,
        processedSize: originalSize,
        quality: 100,
        isCorrupted: true,
      };
    }

    const processedFile = new File([blob], file.name, { type: file.type });
    return {
      file: processedFile,
      originalSize,
      processedSize: processedFile.size,
      quality: boundedQuality,
    };
  } catch (error) {
    console.error("Image processing failed completely:", error);
    return {
      file,
      originalSize,
      processedSize: originalSize,
      quality: 100,
      isCorrupted: true,
    };
  } finally {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}

function checkIfMostlyBlack(pixels: Uint8ClampedArray, totalPixels: number) {
  let suspicious = true;
  for (let i = 0; i < 10; i++) {
    const rand = Math.floor(Math.random() * totalPixels);
    const offset = rand * 4;
    const r = pixels[offset];
    const g = pixels[offset + 1];
    const b = pixels[offset + 2];
    const a = pixels[offset + 3];

    if (!(r === 0 && g === 0 && b === 0 && a === 255)) {
      suspicious = false;
      break;
    }
  }
  return suspicious;
}

// JPEG画像が破損しているかをチェックする関数
async function checkIfJpegIsCorrupted(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    // JPEGのシグネチャをチェック
    const reader = new FileReader();
    reader.onload = () => {
      const arr = new Uint8Array(reader.result as ArrayBuffer);

      // JPEGのシグネチャ(0xFFD8)がない場合は破損とみなす
      if (arr.length < 2 || arr[0] !== 0xff || arr[1] !== 0xd8) {
        resolve(true);
        return;
      }

      // 画像のロードテスト
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);

        // 画像サイズが無効な場合は破損と判断
        if (img.width <= 0 || img.height <= 0) {
          resolve(true);
          return;
        }

        try {
          // 描画テスト
          const canvas = document.createElement("canvas");
          canvas.width = Math.min(10, img.width);
          canvas.height = Math.min(10, img.height);
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            // キャンバスコンテキストが取得できなくても破損とは判断しない
            resolve(false);
            return;
          }

          // 小さな領域を描画してみる
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          try {
            // ピクセルデータを取得
            const imageData = ctx.getImageData(0, 0, 1, 1);
            resolve(false); // 問題なく取得できた場合は破損していない
          } catch (e) {
            // ピクセルデータ取得エラー
            resolve(true);
          }
        } catch (e) {
          // 描画エラー
          resolve(true);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(true); // ロードエラーは破損を示す
      };

      // タイムアウト設定
      setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve(true); // タイムアウトも破損を示す
      }, 3000);

      img.src = url;
    };

    reader.onerror = () => {
      resolve(true); // ファイル読み込みエラーは破損を示す
    };

    reader.readAsArrayBuffer(file.slice(0, 2)); // 先頭2バイトだけ読み込む
  });
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

  // 画質調整を行う
  const processedImageInfo = await adjustImageQuality(file, imageQuality);

  // コールバックがあれば実行
  if (onProcessed) {
    onProcessed(
      processedImageInfo.originalSize,
      processedImageInfo.processedSize,
      processedImageInfo.quality
    );
  }

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
  // Exif情報を削除
  const processedFile = await removeExif(processedImageInfo.file);
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

  // 初回アップロードリクエスト
  response = await fetch(serverApiUrl, {
    method: "POST",
    headers: {
      Authorization: authHeader,
    },
    body: formData,
    signal,
  });

  if (!response.ok) {
    handleErrorResponse(response);
  }

  try {
    statusResponse = await response.json();
  } catch (error) {
    throw new Error("Failed to parse upload response");
  }
  console.log(statusResponse.processing_url);
  // 即時完了している場合は返す
  if (response.status === 201 || !statusResponse.processing_url) {
    return statusResponse;
  }
  // 初回アップロード後、ポーリング前に2秒待機
  await new Promise((resolve) => setTimeout(resolve, 2000));

  let processingAuthToken;
  let signatureFailed = false;

  try {
    processingAuthToken = await getToken(
      statusResponse.processing_url,
      "GET",
      async (e) => await (window.nostr as Nostr.Nip07.Nostr).signEvent(e),
      true
    );
  } catch (error) {
    // 署名失敗した場合
    console.log("Initial signature failed:", error);
    signatureFailed = true;

    // 署名を一度失敗した場合、少し待機してから署名チャレンジ
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 待機後に再度署名を試みる
    try {
      console.log("Retrying signature after wait...");
      processingAuthToken = await getToken(
        statusResponse.processing_url,
        "GET",
        async (e) => await (window.nostr as Nostr.Nip07.Nostr).signEvent(e),
        true
      );
      signatureFailed = false;
      console.log("Retry signature succeeded");
    } catch (retryError) {
      console.log("Retry signature also failed:", retryError);
      throw new Error(
        "Cannot verify if the image was uploaded because signature authorization was denied"
      );
    }
  }

  if (!signatureFailed) {
    console.log("Auth header:", processingAuthToken);
  }

  // 処理待ちの場合は processing_url をポーリング
  while (true) {
    if (Date.now() - startTime > maxWaitTime) {
      return statusResponse;
    }

    const processingResponse = await fetch(statusResponse.processing_url, {
      method: "GET",
      headers: {
        Authorization: processingAuthToken,
      },
      signal,
    });

    if (!processingResponse.ok) {
      throw new Error(
        `Unexpected status code ${processingResponse.status} while polling processing_url`
      );
    }

    if (processingResponse.status === 201) {
      // 処理完了時の最終レスポンスを返す
      return await processingResponse.json();
    }

    const processingStatus = await processingResponse.json();

    if (processingStatus.status === "processing") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }

    if (processingStatus.status === "error") {
      throw new Error("File processing failed");
    }

    throw new Error("Unexpected processing status");
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

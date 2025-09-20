import {
  readServerConfig,
  type FileUploadResponse,
  type OptionalFormDataFields,
} from "./nip96";
import { getToken } from "nostr-tools/nip98";
import * as Nostr from "nostr-typedef";
import { adjustImageQuality, removeExif } from "./imageProcessor";
import { lumiSetting } from "$lib/stores/globalRunes.svelte";
import type { UploaderOption } from "$lib/types";
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

// 共通の画像処理機能
async function processImages(
  files: FileList,
  imageQuality: number = 100,
  onProcessed?: (
    originalSize: number,
    processedSize: number,
    quality: number
  ) => void
): Promise<File[]> {
  const processedFiles: File[] = [];

  for (const file of Array.from(files)) {
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

    // Exif情報を削除
    const processedFile = await removeExif(processedImageInfo.file);
    processedFiles.push(processedFile);
  }

  return processedFiles;
}

// NIP96用のアップロード処理
async function uploadFileNip96(
  file: File,
  options: {
    serverApiUrl: string;
    nip98AuthorizationHeader: string;
    optionalFormDataFields?: Record<string, string>;
    signal?: AbortSignal;
    maxWaitTime?: number;
  }
): Promise<FileUploadResponse> {
  const {
    serverApiUrl,
    nip98AuthorizationHeader,
    optionalFormDataFields,
    signal,
    maxWaitTime = 8000,
  } = options;

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

  formData.append("file", file);

  return pollUploadStatus(
    serverApiUrl,
    formData,
    nip98AuthorizationHeader,
    signal,
    maxWaitTime
  );
}

// Blossom用のアップロード処理（未実装）
async function uploadFileBlossom(
  file: File,
  options: {
    serverApiUrl: string;
    authorizationHeader: string;
    signal?: AbortSignal;
  }
): Promise<FileUploadResponse> {
  // TODO: Blossomのアップロード処理を実装
  // - Blossomプロトコルに従ったリクエスト形式
  // - 認証ヘッダーの処理
  // - レスポンスの解析
  throw new Error("Blossom upload not implemented yet");
}

// メインのアップロード関数
export async function filesUpload(
  files: FileList,
  uploader: UploaderOption,
  signal?: AbortSignal
): Promise<FileUploadResponse[]> {
  console.log(files, uploader);

  // 共通で画像処理をする
  const processedFiles = await processImages(
    files,
    lumiSetting.get().picQuarity,
    (originalSize, processedSize, quality) => {
      console.log(
        `Image processed: ${originalSize} -> ${processedSize} (${quality}%)`
      );
    }
  );

  const { type, address } = uploader;
  let results: FileUploadResponse[] = [];

  // typeによってアップロード処理を分ける
  if (type === "nip96") {
    for (let i = 0; i < processedFiles.length; i++) {
      const file = processedFiles[i];
      const originalFile = Array.from(files)[i];

      try {
        const serverConfig = await readServerConfig(address);
        console.log(serverConfig);

        const header = await getToken(
          serverConfig.api_url,
          "POST",
          async (e) => await (window.nostr as Nostr.Nip07.Nostr).signEvent(e),
          true
        );

        console.log(file);
        console.log(header);
        console.log(serverConfig.api_url);
        console.log(originalFile.type);

        const response: FileUploadResponse = await uploadFileNip96(file, {
          serverApiUrl: serverConfig.api_url,
          nip98AuthorizationHeader: header,
          optionalFormDataFields: { content_type: originalFile.type },
          signal: signal,
        });

        console.log(response);
        results.push(response);
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Upload aborted:", originalFile.name);
          results.push({
            status: "error",
            message: "Upload aborted: " + originalFile.name,
          } as FileUploadResponse);
        } else {
          console.error("Error uploading file:", error);
          results.push({
            status: "error",
            message: "Failed to upload file: " + originalFile.name,
          } as FileUploadResponse);
        }
      }
    }
  } else if (type === "blossom") {
    // TODO: Blossomのアップロード処理
    for (let i = 0; i < processedFiles.length; i++) {
      const file = processedFiles[i];
      const originalFile = Array.from(files)[i];

      try {
        // TODO: Blossomサーバー設定の取得
        // TODO: Blossom認証ヘッダーの生成

        const response: FileUploadResponse = await uploadFileBlossom(file, {
          serverApiUrl: address, // 仮の実装
          authorizationHeader: "", // TODO: 適切な認証ヘッダー
          signal: signal,
        });

        results.push(response);
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Upload aborted:", originalFile.name);
          results.push({
            status: "error",
            message: "Upload aborted: " + originalFile.name,
          } as FileUploadResponse);
        } else {
          console.error("Error uploading file:", error);
          results.push({
            status: "error",
            message: "Failed to upload file: " + originalFile.name,
          } as FileUploadResponse);
        }
      }
    }
  } else {
    throw new Error(`Unsupported uploader type: ${type}`);
  }

  return results;
}

// 画質チェック機能 - ファイル処理するが実際にはアップロードしない
export async function checkImageQuality(
  file: File,
  quality: number
): Promise<ProcessedImageInfo> {
  const processedImageInfo = await adjustImageQuality(file, quality);
  return processedImageInfo;
}

// 既存のpollUploadStatus関数はそのまま使用
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

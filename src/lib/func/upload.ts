import {
  type FileUploadResponse,
  type OptionalFormDataFields,
} from "nostr-tools/nip96";

// エラーハンドリングを共通化
function handleErrorResponse(response: Response): never {
  switch (response.status) {
    case 413:
      throw new Error("File too large!");
    case 400:
      throw new Error("Bad request! Some fields are missing or invalid!");
    case 403:
      throw new Error(
        "Forbidden! Payload tag does not match the requested file!"
      );
    case 402:
      throw new Error("Payment required!");
    default:
      throw new Error("Unknown error in uploading file!");
  }
}

export async function uploadFile(
  file: File,
  serverApiUrl: string,
  nip98AuthorizationHeader: string,
  optionalFormDataFields?: OptionalFormDataFields,
  signal?: AbortSignal // signal を追加
): Promise<FileUploadResponse> {
  const checkedfile = await removeExif(file);
  const formData = new FormData();
  formData.append("Authorization", nip98AuthorizationHeader);

  // optionalFormDataFields を処理
  if (optionalFormDataFields) {
    Object.entries(optionalFormDataFields).forEach(([key, value]) => {
      if (value) {
        formData.append(key, value);
      }
    });
  }
  formData.append("file", checkedfile);

  // 進行状況確認ループ（1秒おきにチェック、最大5秒まで）
  const startTime = Date.now(); // ループ開始時間を記録
  let response: Response;
  let statusResponse: FileUploadResponse;

  // 初回リクエストもこのループ内で処理
  while (true) {
    response = await fetch(serverApiUrl, {
      method: "POST",
      headers: {
        Authorization: nip98AuthorizationHeader,
      },
      body: formData,
      signal, // signal を追加して fetch リクエストに渡す
    });

    // レスポンスエラーチェック
    if (!response.ok) {
      handleErrorResponse(response); // エラー処理を呼び出し
    }

    try {
      statusResponse = await response.json();
    } catch (error: any) {
      throw new Error("Failed to parse status response");
    }

    // 初期レスポンスが201ならすぐに返す
    if (response.status === 201) {
      return statusResponse;
    }

    // 経過時間が5秒を超えたら強制終了//動画だと5病で足りなかったからもうちょい伸ばしてみる
    if (Date.now() - startTime > 8000) {
      return statusResponse;
    }

    // 進行状況が200または202の場合、1秒待機して再チェック
    if (response.status === 200 || response.status === 202) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }

    // それ以外の場合は、ループを終了
    throw new Error("Unexpected status code during file upload process!");
  }
}

export async function removeExif(file: File): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();

  if (file.type === "image/jpeg") {
    const cleanedFile = removeExifFromJPEG(arrayBuffer);
    return new File([cleanedFile], file.name, { type: file.type });
  } else if (file.type === "image/png") {
    const cleanedFile = removeMetadataFromPNG(arrayBuffer);
    return new File([cleanedFile], file.name, { type: file.type });
  }

  return file; // 他の形式の場合
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
  const pngSignature = data.subarray(0, 8); // PNGシグネチャは最初の8バイト
  if (pngSignature.toString() !== "\x89PNG\r\n\x1A\n") {
    return arrayBuffer; // PNG形式でなければそのまま返す
  }

  const chunks: Uint8Array[] = [];
  let offset = 8; // 最初の8バイトはシグネチャ
  let orientationChunk: Uint8Array | null = null;

  while (offset < data.length) {
    const length = new DataView(data.buffer).getUint32(offset); // チャンク長
    const type = String.fromCharCode(...data.subarray(offset + 4, offset + 8));

    // メタデータに関連するチャンクを除外
    if (type !== "tEXt" && type !== "iTXt" && type !== "zTXt") {
      chunks.push(data.subarray(offset, offset + 12 + length)); // 長さ + タイプ + データ + CRC
    } else if (
      type === "tEXt" &&
      data.subarray(offset + 8, offset + 12).toString() === "Orientation"
    ) {
      orientationChunk = data.subarray(offset, offset + 12 + length); // Orientationチャンクを保持
    }

    offset += 12 + length; // チャンク長さ+12バイト(ヘッダ+CRC)
  }

  const cleanedBuffer = new Uint8Array(
    pngSignature.byteLength +
      chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0) +
      (orientationChunk ? orientationChunk.byteLength : 0)
  );
  cleanedBuffer.set(pngSignature, 0);

  let position = pngSignature.byteLength;
  for (const chunk of chunks) {
    cleanedBuffer.set(chunk, position);
    position += chunk.byteLength;
  }

  // Orientationチャンクを追加
  if (orientationChunk) {
    cleanedBuffer.set(orientationChunk, position);
  }

  return cleanedBuffer.buffer;
}

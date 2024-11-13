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
  formData.append("file", file);

  // 初回リクエストの送信
  let response = await fetch(serverApiUrl, {
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

  // 初期レスポンス処理
  let statusResponse: FileUploadResponse;
  try {
    statusResponse = await response.json();
    if (response.status === 201) {
      return statusResponse; // 最初のステータスが201の場合、即座に返す
    }
  } catch (error: any) {
    throw new Error("Failed to parse the initial response");
  }

  // 進行状況確認ループ（1秒おきにチェック、最大5秒まで）
  const startTime = Date.now(); // ループ開始時間を記録
  while (response.status === 200 || response.status === 202) {
    // 1秒待機
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 経過時間が5秒を超えたら強制終了
    if (Date.now() - startTime > 5000) {
      return statusResponse;
    }

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

    if (response.status === 201) {
      // ステータスが201の場合に最終レスポンスを返す
      console.log(response);
      return statusResponse;
    }
  }

  throw new Error("Unexpected status code during file upload process!");
}

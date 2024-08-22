import {
  type FileUploadResponse,
  type OptionalFormDataFields,
} from "nostr-tools/nip96";

export async function uploadFile(
  file: File,
  serverApiUrl: string,
  nip98AuthorizationHeader: string,
  optionalFormDataFields?: OptionalFormDataFields,
  signal?: AbortSignal // signal を追加
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("Authorization", nip98AuthorizationHeader);
  optionalFormDataFields &&
    Object.entries(optionalFormDataFields).forEach(([key, value]) => {
      if (value) {
        formData.append(key, value);
      }
    });
  formData.append("file", file);

  const response = await fetch(serverApiUrl, {
    method: "POST",
    headers: {
      Authorization: nip98AuthorizationHeader,
    },
    body: formData,
    signal, // signal を追加して fetch リクエストに渡す
  });

  if (response.ok === false) {
    if (response.status === 413) {
      throw new Error("File too large!");
    }
    if (response.status === 400) {
      throw new Error("Bad request! Some fields are missing or invalid!");
    }
    if (response.status === 403) {
      throw new Error(
        "Forbidden! Payload tag does not match the requested file!"
      );
    }
    if (response.status === 402) {
      throw new Error("Payment required!");
    }
    throw new Error("Unknown error in uploading file!");
  }

  try {
    console.log(response);
    const parsedResponse = await response.json();
    // if (!validateFileUploadResponse(parsedResponse)) { //Invalidなりがち
    //   throw new Error("Invalid response from the server!");
    // }
    return parsedResponse;
  } catch (error) {
    throw new Error("Error parsing JSON response!");
  }
}

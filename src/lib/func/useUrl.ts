import { createQuery } from "@tanstack/svelte-query";
import { derived, type Readable } from "svelte/store";

export type UrlType = "text" | "image" | "audio" | "movie" | "3D" | "url";

export const useUrl = (
  url: string
): {
  data: Readable<UrlType | null | undefined>;
} => {
  const genQueryKey = () => ["useUrl", url] as const;

  const query = createQuery({
    queryKey: genQueryKey(),
    queryFn: ({ queryKey: [, url] }) => checkFileExtension(url),
    staleTime: 1 * 60 * 60 * 1000, // 1 hour
    gcTime: 1 * 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    data: derived(query, ($query) => $query.data, null),
  };
};

/** ImageFile_Check_正規表現_パターン */
const imageRegex = /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i;
//movie
const movieRegex = /\.(avi|mp4|mov|wmv|flv|mpg)$/i;

const audioRegex = /\.(mp3|wav|ogg|m4a)$/i;

//3Dモデルビューアで表示できるやつ
const threeDRegex = /\.(obj|fbx|gltf|glb|stl)$/i;

// パスから拡張子をチェックする関数
export const checkFileExtension = async (url: string): Promise<UrlType> => {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    // console.log(path);
    if (imageRegex.test(path)) {
      return "image";
    } else if (movieRegex.test(path)) {
      return "movie";
    } else if (audioRegex.test(path)) {
      return "audio";
    } else if (threeDRegex.test(path)) {
      return "3D";
    } else {
      try {
        // HEADリクエストを送信してContent-Typeを取得
        const response = await fetch(url, { method: "HEAD" });
        const contentType = response.headers.get("Content-Type");
        // console.log(contentType);
        if (contentType?.startsWith("image/")) {
          return "image";
        } else if (contentType?.startsWith("video/")) {
          return "movie";
        } else if (contentType?.startsWith("audio/")) {
          return "audio";
        } else if (contentType?.includes("model/")) {
          return "3D";
        } else {
          return "url";
        }
      } catch (error) {
        return "url";
      }
    }
  } catch (error) {
    return "text";
  }
};

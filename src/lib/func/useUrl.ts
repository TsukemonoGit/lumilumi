import { queryClient } from "$lib/stores/stores";
import { createQuery } from "@tanstack/svelte-query";
import { derived, type Readable } from "svelte/store";

export type UrlType =
  | "text"
  | "image"
  | "svg"
  | "audio"
  | "movie"
  | "3D"
  | "url";
const genUrlQueryKey = (url: string) => ["useUrl", url] as const;

export const useUrl = (
  url: string
): {
  data: Readable<UrlType | null | undefined>;
} => {
  const query = createQuery({
    queryKey: genUrlQueryKey(url),
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
// SVGを別で定義
const svgRegex = /\.svg$/i;
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

    // 拡張子チェック - SVGを最初にチェック
    if (svgRegex.test(path)) {
      return "svg";
    } else if (imageRegex.test(path)) {
      return "image";
    } else if (movieRegex.test(path)) {
      return "movie";
    } else if (audioRegex.test(path)) {
      return "audio";
    } else if (threeDRegex.test(path)) {
      return "3D";
    } else {
      try {
        // プロキシAPI経由でContent-Typeを取得
        const response = await fetch(
          `/api/url-check?url=${encodeURIComponent(url)}`
        );
        const data = await response.json();
        const contentType = data.contentType;

        if (contentType?.includes("svg")) {
          return "svg";
        } else if (contentType?.startsWith("image/")) {
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
        console.log(error);
        return "url";
      }
    }
  } catch (error) {
    return "text";
  }
};

export const userPromiseUrl = async (url: string): Promise<UrlType | null> => {
  if (!url) return null;

  const queryKey = genUrlQueryKey(url);

  // キャッシュにあるかチェック
  const cached = queryClient.getQueryData<UrlType>(queryKey);
  if (cached) {
    return cached;
  }

  try {
    // なければ取得
    const type = await checkFileExtension(url);

    // キャッシュにセット
    queryClient.setQueryData(queryKey, type);

    return type;
  } catch (err) {
    console.error("userPromiseUrl error:", err);
    return null;
  }
};

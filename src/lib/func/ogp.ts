import { createQuery } from "@tanstack/svelte-query";
import { derived } from "svelte/store";
import type { Metadata } from "unfurl.js/dist/types";

export type Ogp = {
  title: string;
  image: string;
  description: string;
  favicon: string;
  memo?: string;
};

export let isvalidURL = (str: string): boolean => {
  try {
    const url = new URL(str);
    return url.protocol === "https:";
  } catch {
    return false;
  }
};

export const useOgp = (url: string) => {
  const genQueryKey = () => ["useOgp", url] as const;

  const query = createQuery({
    queryKey: genQueryKey(),
    queryFn: ({ queryKey: [, url] }) => fetchOgpContent(url),
    staleTime: 1 * 60 * 60 * 1000, // 1 hour
    gcTime: 1 * 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    data: derived(query, ($query) => $query.data, null),
  };
};

export const fetchOgpContent = async (
  urlString: string
): Promise<Ogp | null> => {
  try {
    const response = await fetch(
      `/api/ogp?url=${encodeURIComponent(urlString)}`
    ).catch((err) => console.log(err));
    const result = (await response
      ?.json()
      .catch((err) => console.log(err))) as Metadata;
    //console.log(result);
    // APIエンドポイントから取得したOGP情報を返す
    return {
      title:
        (result.open_graph && result.open_graph.title) || result.title || "",
      image:
        result.open_graph && result.open_graph.images
          ? result.open_graph.images[result.open_graph.images.length - 1].url
          : "",
      description:
        (result.open_graph && result.open_graph.description) ||
        result.description ||
        "",
      favicon: result.favicon || "",
    };
  } catch (error) {
    console.log(error);

    return {
      title: "",
      image: "",
      description: "",
      favicon: "",
    };
  }
};

// YouTubeのURLからビデオIDを抽出する関数
export function getYoutubeVideoId(url: string): string | null {
  if (!isvalidURL(url)) return null;

  const urlObj = new URL(url);

  // youtube.comドメインの場合
  if (
    urlObj.hostname === "www.youtube.com" ||
    urlObj.hostname === "youtube.com"
  ) {
    // 通常の動画URL (watch?v=XXXX)
    const videoId = urlObj.searchParams.get("v");
    if (videoId) return videoId;

    // ショート動画URL (/shorts/XXXX)
    if (urlObj.pathname.includes("/shorts/")) {
      return urlObj.pathname.split("/shorts/")[1].split("/")[0];
    }
  }
  // youtu.beドメインの場合（短縮URL）
  else if (urlObj.hostname === "youtu.be") {
    // パスから直接ビデオID取得 (/XXXX)
    return urlObj.pathname.substring(1);
  }

  return null;
}

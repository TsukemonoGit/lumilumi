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
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

export const useOgp = (url: string) => {
  const genQueryKey = () => ["useOgp", url] as const;

  const query = createQuery({
    queryKey: genQueryKey(),
    queryFn: ({ queryKey: [, url] }) => fetchOgpContent(url),
    staleTime: 1 * 60 * 60 * 1000, // 4 hour
    gcTime: 1 * 60 * 60 * 1000, // 4 hour
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
    // console.log(result);
    // APIエンドポイントから取得したOGP情報を返す
    return {
      title: result.title || "",
      image:
        result.open_graph && result.open_graph.images
          ? result.open_graph.images[result.open_graph.images.length - 1].url
          : "",
      description: (result.open_graph && result.open_graph.description) || "",
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

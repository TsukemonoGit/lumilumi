import { createQuery } from "@tanstack/svelte-query";
import { derived, readable } from "svelte/store";

export type Ogp = {
  url: string;
  title: string;
  image: string;
  description: string;
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
    staleTime: 4 * 60 * 60 * 1000, // 4 hour
    gcTime: 4 * 60 * 60 * 1000, // 4 hour
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
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(urlString)}`;
  const res = await fetch(proxyUrl, { headers: { Accept: "text/html" } });
  const text = await res.text();
  return parseOgp(text, urlString);
};

export const parseOgp = (text: string, urlString: string): Ogp | null => {
  const doc = new DOMParser().parseFromString(text, "text/html");
  return parseOgpFromDOM(doc, urlString);
};

export const parseOgpFromDOM = (
  doc: HTMLDocument,
  urlString: string
): Ogp | null => {
  const props: { [property: string]: string } = {};

  Array.from(doc.head.querySelectorAll("meta")).forEach((m) => {
    const property = m.getAttribute("property");
    const content = m.getAttribute("content");
    if (property != null && content != null) {
      props[property] = content;
    }
  });

  // 画像のURLを絶対パスに変換する処理を追加
  if (props["og:image"] && props["og:image"].startsWith("./")) {
    const baseUrl = new URL(urlString);
    const imageUrl = new URL(props["og:image"], baseUrl);
    props["og:image"] = imageUrl.toString();
  }

  if (props["og:title"] != null) {
    return {
      title: props["og:title"],
      description: props["og:description"] ?? "",
      image: props["og:image"] ?? "",
      url: props["og:url"] ?? "",
    } satisfies Ogp;
  }
  return null;
};

import { createQuery } from "@tanstack/svelte-query";
import { derived, readable } from "svelte/store";

export type Ogp = {
  url: string;
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
  baseUrl: string
): Ogp | null => {
  const props: { [property: string]: string } = {};

  Array.from(doc.head.querySelectorAll("meta")).forEach((m) => {
    const property = m.getAttribute("property");
    const content = m.getAttribute("content");
    if (property != null && content != null) {
      props[property] = content;
    }
  });

  // Favicon URLを取得
  const faviconElement =
    doc.querySelector('link[rel="icon"]') ||
    doc.querySelector('link[rel="shortcut icon"]');
  let faviconUrl = "";
  if (faviconElement) {
    const faviconHref = faviconElement.getAttribute("href");
    if (faviconHref) {
      faviconUrl = toAbsolutePath(faviconHref, baseUrl);
    }
  }

  // 画像のURLを絶対パスに変換する処理を追加
  props["og:image"] = toAbsolutePath(props["og:image"], baseUrl);

  if (props["og:title"] != null) {
    return {
      title: props["og:title"],
      description: props["og:description"] ?? "",
      image: props["og:image"] ?? "",
      url: props["og:url"] ?? "",
      favicon: faviconUrl,
    } satisfies Ogp;
  }
  return null;
};

// 絶対パスに変換する関数
const toAbsolutePath = (
  relativePath: string | undefined,
  baseUrl: string
): string => {
  if (
    relativePath &&
    (relativePath.startsWith("./") || relativePath.startsWith("/"))
  ) {
    const base = new URL(baseUrl);
    const absoluteUrl = new URL(relativePath, base);
    return absoluteUrl.toString();
  }
  return relativePath ?? "";
};

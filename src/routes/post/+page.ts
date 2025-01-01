import type { PageLoad } from "./$types";

// サーバーサイドからデータを受け取る
interface Data {
  title?: string;
  text?: string;
  url?: string;
  media?: string;
}

// PageLoad 型を適切に指定
export const load: PageLoad = async ({ data }) => {
  // `data` が `null` かもしれないので、安全にチェック
  const { title, text, url, media }: Data = data ?? {};

  return {
    title: title || "",
    text: text || "",
    url: url || "",
    media: media || "",
  };
};

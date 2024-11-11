// +page.server.ts
import { fail } from "@sveltejs/kit";

let data: { title: any; text: any; url?: any; media?: any } = {
  title: "Sample Title",
  text: "This is a message from the server",
};

export async function load() {
  // 直接オブジェクトを返す
  return { data }; // クライアントにデータを返す
}

export const actions = {
  default: async ({ request }) => {
    try {
      // FormDataを使用してリクエストボディを取得
      const formData = await request.formData();

      // フォームデータから値を取得
      data = {
        title: formData.get("title"),
        text: formData.get("text"),
        url: formData.get("url"),
        media: formData.get("media"),
      };

      if (!data.title && !data.text && !data.url && !data.media) {
        return fail(400, { message: "invalid" });
      }

      // フロントエンドにデータを返す
      return { success: true };
    } catch (err) {
      console.error(err);
      return fail(400, { message: "invalid" });
    }
  },
};

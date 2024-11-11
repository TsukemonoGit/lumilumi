import { json, error, fail } from "@sveltejs/kit";

export const actions = {
  default: async ({ request }) => {
    try {
      // FormDataを使用してリクエストボディを取得
      const formData = await request.formData();

      // フォームデータから値を取得
      const title = formData.get("title");
      const text = formData.get("text");
      const url = formData.get("url");
      const media = formData.get("media");

      if (!title && !text && !url && !media) {
        return fail(400, { message: "invalid" });
      }

      return { success: true };
    } catch (err) {
      console.error(err);
      return fail(400, { message: "invalid" });
    }
  },
};

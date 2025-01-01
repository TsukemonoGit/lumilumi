// +page.server.ts

import { fail } from "@sveltejs/kit";

let data: { title: any; text: any; url?: any; media?: any } = {
  title: "",
  text: "",
};

export const actions = {
  default: async ({ request }) => {
    try {
      const formData = await request.formData();

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
      return { success: true, data }; // 成功時にデータも返す
    } catch (err) {
      console.error(err);
      return fail(400, { message: "invalid" });
    }
  },
};

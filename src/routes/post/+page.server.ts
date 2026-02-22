// +page.server.ts

import { fail, type RequestEvent } from "@sveltejs/kit";

let data: { title: any; text: any; url?: any; media?: any } = {
  title: "",
  text: "",
};

export const actions = {
  default: async ({ request }: RequestEvent) => {
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
      return { success: true };
    } catch (err) {
      console.error(err);
      return fail(400, { message: "invalid" });
    }
  },
};

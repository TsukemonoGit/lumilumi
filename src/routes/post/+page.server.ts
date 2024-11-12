// +page.server.ts
import {
  convertMetaTags,
  filesUpload,
  fileUpload,
  mediaUploader,
} from "$lib/func/util.js";
import { fail } from "@sveltejs/kit";

let data: { title: any; text: any; url?: any; media?: any } = {
  title: "",
  text: "",
};

// export async function load() {
//   return data;
// }

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
      return { success: true };
    } catch (err) {
      console.error(err);
      return fail(400, { message: "invalid" });
    }
  },
};

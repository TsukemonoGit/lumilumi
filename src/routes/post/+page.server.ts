import { json, error } from "@sveltejs/kit";

export const actions = {
  default: async ({ request }) => {
    try {
      const formData = new URLSearchParams(await request.text());
      console.log(formData);
      // Extract the data from the form
      const title = formData.get("title");
      const text = formData.get("text");
      const url = formData.get("url");
      const media = formData.get("media");

      // Log extracted data to check their values
      console.log("Title:", title);
      console.log("Text:", text);
      console.log("URL:", url);
      console.log("Media:", media);

      if (!title && !text && !url && !media) {
        throw error(400, "Missing required fields");
      }

      // Here, you can process the data, e.g., save to the database or handle it
      // For the sake of this example, let's return the submitted data
      return json({
        success: true,
        title,
        text,
        url,
        media,
      });
    } catch (err) {
      console.error(err);
      throw error(500, "Server error");
    }
  },
};

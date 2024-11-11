/// <reference lib="webworker" />
self.addEventListener("fetch", (event) => {
  if (
    // @ts-ignore
    event.request.method === "POST" &&
    // @ts-ignore
    new URL(event.request.url).pathname === "/post"
  ) {
    // @ts-ignore
    event.respondWith(
      (async function () {
        // @ts-ignore
        const formData = await event.request.formData();
        const title = formData.get("title");
        const text = formData.get("text");
        const url = formData.get("url");
        const files = formData.getAll("media");

        // クライアントに共有データを送信
        // @ts-ignore
        const allClients = await (self).clients.matchAll({
          includeUncontrolled: true,
        });
        // @ts-ignore
        allClients.forEach((client) => {
          client.postMessage({ title, text, url, files });
        });

        return new Response("", { status: 200 });
      })()
    );
  }
});

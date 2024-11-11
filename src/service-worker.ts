self.addEventListener("fetch", (event: any) => {
  if (
    event.request.method === "POST" &&
    new URL(event.request.url).pathname === "/post"
  ) {
    event.respondWith(
      (async function () {
        const formData = await event.request.formData();
        const title = formData.get("title");
        const text = formData.get("text");
        const url = formData.get("url");
        const files = formData.getAll("media");

        // クライアントに共有データを送信
        const allClients = await (self as any).clients.matchAll({
          includeUncontrolled: true,
        });
        allClients.forEach((client) => {
          client.postMessage({ title, text, url, files });
        });

        return new Response("", { status: 200 });
      })()
    );
  }
});

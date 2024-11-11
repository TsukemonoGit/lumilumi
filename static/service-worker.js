/// <reference lib="webworker" />
// サービスワーカー内でのメッセージ送信の確認
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
        const media = formData.getAll("media");

        // クライアントに共有データを送信
        const allClients = await self.clients.matchAll({
          includeUncontrolled: true,
        });
        allClients.forEach((client) => {
          client.postMessage({ title, text, url, media });
        });

        return new Response("", { status: 200 });
      })()
    );
  }
});
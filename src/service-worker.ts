self.addEventListener("fetch", (event: any) => {
  const url = new URL(event.request.url);

  if (event.request.method === "POST" && url.pathname === "/share") {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const title = formData.get("title");
        const text = formData.get("text");
        const url = formData.get("url");
        const files = formData.getAll("media"); // 送信されたメディアファイル

        // 必要な処理（例えば、データを保存する、UIに通知を送るなど）
        console.log({ title, text, url, files });

        // フォアグラウンドページにデータを送信する方法
        (self as any).clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              title,
              text,
              url,
              files,
            });
          });
        });

        // レスポンスを返す
        return new Response("Data received successfully!", {
          status: 200,
        });
      })()
    );
  }
});

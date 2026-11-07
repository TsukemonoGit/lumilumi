import { getZapEndpoint } from "nostr-tools/nip57";

import { afterEach, expect, test, vi } from "vitest";
import { queryClient } from "$lib/stores/stores";
import { makeInvoice } from "./zap";
import type { EventTemplate } from "nostr-tools";

const metadata = {
  content:
    '{"picture":"https://share.yabu.me/84b0c46ab699ac35eb2ca286470b85e081db2087cdef63932236c397417782f5/b5e7ae7c051b80be7519e23b093c9f5835b0184acc6d36552234f8f95540e357.webp","banner":"https://share.yabu.me/84b0c46ab699ac35eb2ca286470b85e081db2087cdef63932236c397417782f5/b639740b6e2acca2e7987939fcba7386906300ddb2a462bd432d8a97d19752f0.webp","name":"mono","display_name":"もの₍ ･ᴗ･ ₎","about":"₍ ･ᴗ･ ₎:monokashiwa:\\n\\n(ひとりごと)\\n2023/02/04(土)17時位 に はじめました \\n\\n【消えたいろいろを復活させたいやつ】\\nhttps://tsukemonogit.github.io/luminostr/\\n\\n【消失したブクマを復元させたいやつ】\\nhttps://nostr-bookmark-recovery-tool.vercel.app/\\n\\n【プロフィールを編集するやつ】\\nhttps://nos-profile-arekore.vercel.app/\\n\\n【いろんなリスト見るやつ】\\nhttps://nostviewstr.vercel.app/\\n\\n【ぶくまびうあ】\\nhttps://nostr-bookmark-viewer3.vercel.app/\\n\\n【ノートを単品で複製したいときのやつ】\\nhttps://dupstr.vercel.app/\\n\\n【もの画像】\\nhttps://tsukemonogit.github.io/nostr-monoGazo-bot/\\n\\n【初めてクエストを達成した者】\\nhttps://nostx.shino3.net/note18kn29rrwehlp9dgpqlrem3ysk5tt6ucl2h2tj4e4uh53facc6g2qxwa77h","nip05":"mono@tsukemonogit.github.io","lud16":"test@zap-test.example"}',
  created_at: 1730112014,
  id: "328ae27ece2415cfce0d6531094433683d648b2ddd526d5011bd12358fb343db",
  kind: 0,
  pubkey: "84b0c46ab699ac35eb2ca286470b85e081db2087cdef63932236c397417782f5",
  sig: "7cda6a6601b2e5885a9e36f9637bcb6aada0055bbb07637ea2f4407b9559f22c83393e71f90cecd798fbe654875a96085e7e3683ec4b7da0c1d2d2f4a975bb66",
  tags: [["emoji", "monokashiwa", "https://i.imgur.com/aRcM4IC.png"]],
};

test("", async () => {
  try {
    const zapEndpoint = await getZapEndpoint(metadata);
    console.log("zapEndpoint", zapEndpoint);
    if (!zapEndpoint) {
      return null;
    }
  } catch (error) {
    return null;
  }
});

const lnurl = "https://zap-test.example/.well-known/lnurlp/test";
const callback = "https://wallet.example/callback?keep=1&token=a%2Bb";

afterEach(() => {
  vi.unstubAllGlobals();
  queryClient.removeQueries({ queryKey: ["fetchNnurl", lnurl] });
});

test("makeInvoiceは特殊文字をエンコードし、callbackの既存クエリを保持する", async () => {
  const comment = "test & + #";
  const signEvent = vi.fn(async (event: EventTemplate) => ({
    ...event,
    id: "signed-event-id",
    sig: "signed-event-signature",
  }));
  const fetchMock = vi.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ pr: "lnbc-test" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  );

  queryClient.setQueryData(["fetchNnurl", lnurl], {
    allowsNostr: true,
    nostrPubkey: "nostr-pubkey",
    callback,
  });
  vi.stubGlobal("window", { nostr: { signEvent } });
  vi.stubGlobal("fetch", fetchMock);

  const invoice = await makeInvoice({
    metadata,
    amount: 1234,
    comment,
    zapRelays: [],
  });

  expect(invoice).toBe("lnbc-test");
  expect(fetchMock).toHaveBeenCalledTimes(1);

  const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
  expect(requestUrl.searchParams.get("keep")).toBe("1");
  expect(requestUrl.searchParams.get("token")).toBe("a+b");
  expect(requestUrl.searchParams.get("amount")).toBe("1234");

  const nostr = requestUrl.searchParams.get("nostr");
  expect(nostr).not.toBeNull();
  expect(JSON.parse(nostr ?? "").content).toBe(comment);
});

import { getZapEndpoint } from "nostr-tools/nip57";
import { test } from "vitest";

const metadata = {
  content:
    '{"picture":"https://share.yabu.me/84b0c46ab699ac35eb2ca286470b85e081db2087cdef63932236c397417782f5/b5e7ae7c051b80be7519e23b093c9f5835b0184acc6d36552234f8f95540e357.webp","banner":"https://share.yabu.me/84b0c46ab699ac35eb2ca286470b85e081db2087cdef63932236c397417782f5/b639740b6e2acca2e7987939fcba7386906300ddb2a462bd432d8a97d19752f0.webp","name":"mono","display_name":"もの₍ ･ᴗ･ ₎","about":"₍ ･ᴗ･ ₎:monokashiwa:\\n\\n(ひとりごと)\\n2023/02/04(土)17時位 に はじめました \\n\\n【消えたいろいろを復活させたいやつ】\\nhttps://tsukemonogit.github.io/luminostr/\\n\\n【消失したブクマを復元させたいやつ】\\nhttps://nostr-bookmark-recovery-tool.vercel.app/\\n\\n【プロフィールを編集するやつ】\\nhttps://nos-profile-arekore.vercel.app/\\n\\n【いろんなリスト見るやつ】\\nhttps://nostviewstr.vercel.app/\\n\\n【ぶくまびうあ】\\nhttps://nostr-bookmark-viewer3.vercel.app/\\n\\n【ノートを単品で複製したいときのやつ】\\nhttps://dupstr.vercel.app/\\n\\n【もの画像】\\nhttps://tsukemonogit.github.io/nostr-monoGazo-bot/\\n\\n【初めてクエストを達成した者】\\nhttps://nostx.shino3.net/note18kn29rrwehlp9dgpqlrem3ysk5tt6ucl2h2tj4e4uh53facc6g2qxwa77h","nip05":"mono@tsukemonogit.github.io","lud16":"mono@coinos.io"}',
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

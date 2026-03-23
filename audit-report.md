<!--https://gist.github.com/ikuradon/977e0ccc9ce88e4cf01b9cb9ce88b3dd-->

# Lumilumi 全ソースコード監査レポート

**対象:** lumilumi (SvelteKit + Svelte 5 Nostrクライアント) — 415ソースファイル
**監査日:** 2026-03-21
**監査観点:** セキュリティ / バグ・ロジック / TypeScript品質 / アーキテクチャ / パフォーマンス・メモリ
**監査方法:** 5つの専門エージェントによる並列静的解析

---

## エグゼクティブサマリー

| 深刻度   | 件数   |
| -------- | ------ |
| CRITICAL | 7      |
| HIGH     | 18     |
| MEDIUM   | 21     |
| LOW      | 11     |
| **合計** | **57** |

最も緊急性が高いのはサーバーサイドAPI (`/api/url-check`, `/api/ogp`) のSSRF脆弱性と、`svelte.config.js` でのCSRF保護全面無効化。これらは外部から直接悪用可能。

---

## CRITICAL (即時対応必須) — 7件

---

### C-1. SSRF脆弱性: `/api/url-check` エンドポイント → Done

**カテゴリ:** セキュリティ
**ファイル:** `src/routes/api/url-check/+server.ts:5-36`

**説明:**
`targetUrl` パラメータに対してプロトコル検証もドメインホワイトリストも設定されていない。攻撃者は `url` パラメータに任意のアドレスを渡すことで、サーバーから内部ネットワークやクラウドメタデータサービスへHTTPリクエストを送出させることができる。

```
GET /api/url-check?url=http://169.254.169.254/latest/meta-data/
GET /api/url-check?url=http://internal-db:5432/
GET /api/url-check?url=file:///etc/passwd
```

**推奨修正:**

```typescript
const ALLOWED_PROTOCOLS = ["https:"];

const parsed = new URL(targetUrl);
if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
  throw error(400, { message: "Only HTTPS URLs are allowed" });
}

const blockedRanges =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|169\.254\.|::1|\[::1\])/i;
if (blockedRanges.test(parsed.hostname)) {
  throw error(403, { message: "Private addresses are not allowed" });
}
```

---

### C-2. SSRF脆弱性: `/api/ogp` エンドポイント → Done

**カテゴリ:** セキュリティ
**ファイル:** `src/routes/api/ogp/+server.ts:6-46`

**説明:**
`unfurl()` に渡すURLのバリデーションが不十分。`parsedUrl.host` の検査は行われているが、プライベートIPアドレス、`file://` プロトコル、内部サービスへのアクセスをブロックするチェックがない。`unfurl.js` はリダイレクトを自動追跡するため、間接SSRF（オープンリダイレクト経由）も成立する。

Nostrユーザーが投稿内に内部URLを含めるだけで、そのURLを閲覧した他のユーザーのブラウザがサーバー経由で内部リソースにアクセスしてしまう。

**推奨修正:** `url-check` エンドポイントと同様のプロトコル・IPバリデーションを追加。

---

### C-3. CSRF保護の全面無効化 → Done

**カテゴリ:** セキュリティ / アーキテクチャ
**ファイル:** `svelte.config.js:22-24`, `src/hooks.server.ts`

**説明:**

```javascript
csrf: {
  trustedOrigins: ["*"];
}
```

全オリジンからのPOSTフォーム送信を許可しており、CSRF攻撃に対して完全に脆弱。

**技術的制約:**
Web Share Target APIの仕様により、OSまたはブラウザが送信元となるPOSTリクエストでは `Origin` ヘッダーが `lumilumi.app` / `lumilumi.vercel.app` と一致しない。具体的オリジンに限定すると `Cross-site POST form submissions are forbidden` が発生し、共有機能が使用不能になる。SvelteKitの組み込みCSRFチェックは `handle` フックより前に実行されるため、ルート単位での除外も不可能。

**対応内容:**

- `svelte.config.js`: `trustedOrigins: ["*"]` を維持し、SvelteKit組み込みのCSRFチェックを無効化
- `src/hooks.server.ts`: `handle` 内で自前のOrigin検証を実装
  - `/post` へのPOST（Web Share Target）はバイパス
  - それ以外のPOSTリクエストは `allowedOrigins` リストで検証し、不一致の場合403を返す

---

### C-4. `rxNostr3RelaysReconnectChallenge` が誤ったインスタンスにreconnect → Done

**カテゴリ:** バグ
**ファイル:** `src/lib/func/reactions.ts:50-52`

**説明:**

```typescript
// rxNostr3 のリレーエラーを検出しているのに rxNostr に reconnect している
relays.forEach(([key, value]) => {
  get(app).rxNostr.reconnect(key); // ← rxNostr3 であるべき
});
```

この関数は `rxNostr3` のリレー接続エラーを検出してループしているにもかかわらず、`rxNostr`（メインのrxNostrインスタンス）にreconnectを呼んでいる。結果として `rxNostr3` のリレー接続は永久に回復されず、リアクション・リポストの受信がサイレントに失敗し続ける。

**推奨修正:**

```typescript
get(app).rxNostr3.reconnect(key);
```

---

### C-5. `NostrElements.svelte` の条件反転バグ → Done

**カテゴリ:** バグ
**ファイル:** `src/routes/NostrElements.svelte:53-59`

**説明:**

```typescript
const data: EventPacket[] | undefined =
  queryClient?.getQueryData(timelineQuery);
if (data && data.length <= 0) {
  // ← "0以下" の場合に data[0] を読む
  since = data[0].event.created_at; // ← data が空配列なら undefined アクセス → TypeError
} else {
  since = ev[0].event.created_at;
}
```

条件が完全に反転している。`data.length <= 0`（配列が空）のときに `data[0]` を参照しようとするため、ランタイムエラーが発生する。

**推奨修正:**

```typescript
if (data && data.length > 0) {
  since = data[0].event.created_at;
} else {
  since = ev[0].event.created_at;
}
```

---

### C-6. `fetchOgpContent` の undefined を Metadata 型にキャスト → Done

**カテゴリ:** TypeScript品質
**ファイル:** `src/lib/func/ogp.ts:48-53`

**説明:**

```typescript
const response = await fetch(...).catch((err) => console.log(err));
const result = (await response?.json().catch((err) => console.log(err))) as Metadata;
```

`fetch` が失敗すると `response` は `undefined` → `response?.json()` も `undefined` → `result` に `undefined` が `Metadata` としてキャストされる → その後 `result.open_graph` 等にアクセスするとランタイムエラー。

**推奨修正:**

```typescript
const response = await fetch(`/api/ogp?url=${encodeURIComponent(url)}`);
if (!response.ok) return { title: "", image: "", description: "", favicon: "" };
const result: Metadata = await response.json();
```

---

### C-7. メモリリーク: `observedEvents` Set / `tieMap` が無制限に成長 → Done (Max 5000)

**カテゴリ:** パフォーマンス
**ファイル:** `src/lib/stores/operators.ts:30, 356-370`

**説明:**

```typescript
// モジュールスコープで宣言されており、セッション中に永遠に蓄積される
const observedEvents = new Set<string>(); // 行356 — 削除されることがない
const memo = new Map<string, Set<string>>(); // 行30 — eventId → relays、削除なし
```

アプリケーションが動作し続けるほど、受信した全イベントIDがこれらのコレクションに蓄積される。数万件規模になりうる。リセット・上限・TTLのいずれも存在しない。

**推奨修正:** LRU上限付きキャッシュ（最大5000件で古いものを削除）を採用するか、アプリ状態リセット時にクリアする仕組みを追加する。

---

## HIGH (早期対応推奨) — 18件

---

### H-1. APIエンドポイントにレート制限なし → Done?

**カテゴリ:** セキュリティ
**ファイル:** `src/hooks.server.ts`, `src/routes/api/`

`/api/ogp` と `/api/url-check` にレート制限が存在しない。外部ネットワークへのプロキシとして機能するため、DoS攻撃や帯域幅消費攻撃に悪用可能。

**推奨修正:** `hooks.server.ts` にインメモリレート制限（IPベース、60req/分等）を追加。

---

### H-2. 本番環境にセキュリティヘッダー欠如 → Done

**カテゴリ:** セキュリティ
**ファイル:** `src/hooks.server.ts`, `vite.config.ts`

`vite.config.ts` の `server.headers` は開発サーバー専用のCSPのみ。本番ビルドには以下が欠如:

- `Content-Security-Policy` (本番環境)
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Strict-Transport-Security`
- `Referrer-Policy`
- `Permissions-Policy`

`app.html` の外部スクリプト `model-viewer.min.js` もCSPなしでロードされている。

**推奨修正:** `hooks.server.ts` の `resolve()` 後にセキュリティヘッダーを一括設定。

**対応内容:**

- `hooks.server.ts` にて全レスポンスにセキュリティヘッダーを一括付与
  - `Content-Security-Policy`（`model-viewer.min.js` のホスト `https://ajax.googleapis.com` および `ws: wss:` を許可）
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `vite.config.ts` の `server.headers` は開発サーバー専用のため変更不要

---

### H-3. `markdown-it-link.ts` が `javascript:` スキームを許可 → Done

**カテゴリ:** セキュリティ
**ファイル:** `src/lib/func/markdown-it/markdown-it-link.ts:7-17`

```typescript
const linkRegex = /^<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i;
tokenOpen.attrs = [["href", href]]; // プロトコル検証なし
```

Nostr投稿内に `<a href="javascript:alert(1)">click</a>` を記述した場合、`Link.svelte` (Simple版) では `checkSafe()` が適用されず JavaScript スキームのリンクが生成される可能性がある。

**推奨修正:** プロトコルホワイトリスト (`https:`, `http:`, `mailto:`) を追加。

---

### H-4. `allowedOrigins` にトレーリングスラッシュでCORSが機能しない → Done

**カテゴリ:** セキュリティ
**ファイル:** `src/hooks.server.ts:7-10`

```typescript
const allowedOrigins = [
  "https://lumilumi.vercel.app/", // ← トレーリングスラッシュ
  "https://lumilumi.app/", // ← トレーリングスラッシュ
];
```

RFC 6454によると `Origin` ヘッダーの値にはパスを含まない（例: `https://lumilumi.app`）。設定された値は実際のリクエストにマッチしない。

**推奨修正:** トレーリングスラッシュを削除。

---

### H-5. `getZapRelay` キャッシュキー不一致 → Done

**カテゴリ:** バグ
**ファイル:** `src/lib/func/zap.ts:183-209`

```typescript
// 取得時
let queryRelay = queryClient.getQueryData(["defaultRelay", pubkey]);
// 保存時（別のキーに保存）
queryClient.setQueryData(["relays", pubkey], ...);
```

取得キーと保存キーが異なるため、キャッシュが永遠にヒットせず毎回リレーにリクエストが発生する。

**推奨修正:** 保存キーを `["defaultRelay", pubkey]` に統一。

---

### H-6. `filterNaddr` が `d` タグをインデックス0固定で探索 (NIP-01違反) → Done

**カテゴリ:** バグ
**ファイル:** `src/lib/stores/operators.ts:96-103`

```typescript
event.tags?.[0]?.[1] && event.tags[0][1] === identifier; // ← タグ配列の先頭だけを見ている // ← d タグが必ず tags[0] にあると仮定
```

NIP-01では `d` タグが必ずtagsの最初の要素に来る保証はない。他のタグが先頭に置かれているイベントではフィルタが誤って失敗する。

**推奨修正:**

```typescript
event.tags.find((tag) => tag[0] === "d")?.[1] === identifier;
```

---

### H-7. `zappedPubkey` が NIP-57 に準拠していない → Done

**カテゴリ:** バグ
**ファイル:** `src/lib/stores/operators.ts:271-279`

```typescript
export const zappedPubkey = (event: Nostr.Event): string | undefined => {
  return JSON.parse(
    event.tags.find((tag) => tag[0] === "description")?.[1] ?? "",
  ).pubkey; // ← description 内の kind 9734 の pubkey はザップ「送信者」
};
```

NIP-57ではZapレシート (kind 9735) の `p` タグがザップ対象pubkeyを直接保持している。description内のpubkeyはザップ送信者のpubkey。

**NIP-57準拠の修正:**

```typescript
event.tags.find((tag) => tag[0] === "p")?.[1];
```

---

### H-8. `usePromiseReq` のエラーパスでsubscriptionリーク → Done?

**カテゴリ:** バグ
**ファイル:** `src/lib/func/nostr.ts:615-651`

`completeOnTimeout(timeout)` と外側の `setTimeout(timeout + 10000)` が二重に設定されている。`error` コールバックは `clearTimeout` を呼んでいるがsubscriptionをアンサブスクライブしていない。

**推奨修正:** `error` コールバックでも `subscription.unsubscribe()` を呼ぶ。

---

### H-9. 空の `catch (error) {}` が11箇所 — エラー完全消失

**カテゴリ:** TypeScript品質
**ファイル:** 9ファイル

該当箇所:

- `src/routes/+layout.svelte` (L279, L304)
- `src/routes/Menu.svelte` (L42)
- `src/routes/[note=note]/+page.svelte` (L41)
- `src/routes/Sidebar.svelte` (L28)
- `src/lib/func/nostr.ts` (L150)
- `src/lib/components/UserPicker.svelte` (L28)
- `src/lib/components/NostrElements/UserDataList.svelte` (L34)
- `src/lib/components/SettingsElements/Kind30078.svelte` (L69)
- `src/lib/components/SettingsElements/Settings.svelte` (L98, L112)

テーマ初期化の失敗、localStorage読み書き失敗、JSONパースエラーが本番環境で一切通知されない。

**推奨修正:** 最低限 `console.error(error)` を記録。重要な処理ではユーザーフィードバックを追加。

---

### H-10. `throw Error()` メッセージなしが8箇所

**カテゴリ:** TypeScript品質
**ファイル:** `src/lib/func/useReq.ts` (L34, L41, L136, L141, L244, L249, L351, L356), `src/lib/func/nostr.ts` (L405)

デバッグ不可能。

**推奨修正:** `throw new Error("具体的なメッセージ")` を使用。

---

### H-11. `set3Relays` が `get(app)` の戻り値を直接ミューテート

**カテゴリ:** TypeScript品質
**ファイル:** `src/lib/func/reactions.ts:28-34`

```typescript
export function set3Relays(relays: any) {
  if (!get(app).rxNostr3) {
    get(app).rxNostr3 = createRxNostr(...);  // ストアの中のオブジェクトを直接書き換え
  }
```

Svelteの `writable` ストアの内部オブジェクトを `app.update()` を経由せず直接変更。リアクティビティをバイパスし未定義の挙動を引き起こす。

**推奨修正:**

```typescript
app.update((state) => ({ ...state, rxNostr3: createRxNostr(...) }));
```

---

### H-12. `removeFirstMatchingId` / `sortEventPackets` が引数配列を直接ミューテーション

**カテゴリ:** バグ
**ファイル:** `src/lib/func/event.ts:129-136`, `src/lib/func/util.ts:241-256`

```typescript
// event.ts — splice で渡されたオリジナル配列を直接変更
viewEventIds.splice(index, 1);
return viewEventIds;

// util.ts — Array.sort() は in-place ソートで元の配列を変更
return events.sort(...);
```

ストア内部のオブジェクトが直接変更されるため、Svelteのリアクティビティが正しくトリガーされない場合がある。

**推奨修正:**

```typescript
// event.ts
const newArr = [...viewEventIds];
newArr.splice(index, 1);
return newArr;

// util.ts
return [...events].sort(...);
```

---

### H-13. `publishEvent` でサブスクリプションが放置される

**カテゴリ:** TypeScript品質
**ファイル:** `src/lib/func/nostr.ts:407-413`

```typescript
_rxNostr.send(ev).subscribe((packet) => {
  // コメントアウトされたデバッグコードのみ
});
```

`Subscription` を保存せず、送信エラーのハンドラもない。OKパケットのエラー応答 (`packet.ok === false`) も無視。

**推奨修正:** `error` ハンドラを追加し、`ok === false` のパケットを処理する。

---

### H-14. `useReq` / `useForwardReq` の Observable サブスクリプションがアンサブスクライブされない

**カテゴリ:** パフォーマンス
**ファイル:** `src/lib/func/useReq.ts:64-85` (useReq), `163-185` (useForwardReq), `378-400` (useGlobalReq)

```typescript
obs.subscribe({
  next: (v) => { ... },
  complete: () => status.set("success"),
  error: (e) => { ... },
});
// Subscription オブジェクトを受け取っているが unsubscribe() を呼び出す手段がない
```

特に `useForwardReq` のObservableはフォワードリクエストのため永続する。コンポーネントアンマウント時にも購読が残り続ける。

**推奨修正:** `onDestroy` またはTanStack Queryの `queryFn` キャンセル機構 (`signal.aborted`) でサブスクリプションを解除。

---

### H-15. `eruda` (400KB) が本番ビルドで条件チェックなくロードされる → そのまま

**カテゴリ:** パフォーマンス
**ファイル:** `src/lib/components/Debug/DebugPanel2.svelte:14-16`

```typescript
onMount(async () => {
  const eruda = await import("eruda"); // 本番環境でも動的インポートされる
  erudaInstance = eruda.default.init();
});
```

`import.meta.env.MODE === "development"` などの条件チェックなく本番でもインポートされる。

**推奨修正:** `import.meta.env.DEV` によるガードを追加。

---

### H-16. LocalStorage に全フォロイーのメタデータを同期的にJSON書き込み → 部分対応（IndexedDB移行で根本解決予定）

**カテゴリ:** パフォーマンス
**ファイル:** `src/lib/func/nostr.ts:122-152`

```typescript
metadataQueue.subscribe((queue) => {
  const metadataStr = localStorage.getItem(STORAGE_KEYS.METADATA); // 同期読み取り
  let currentMetadata = JSON.parse(metadataStr);
  // ...
  localStorage?.setItem(STORAGE_KEYS.METADATA, JSON.stringify(currentMetadata));
});
```

フォロイーが数百人いる場合、数MBのJSON書き込みが頻繁に発生。`JSON.stringify(key) === JSON.stringify(key)` による検索もO(n)。

**推奨修正:** IndexedDBの使用、またはpubkeyごとに個別キーに分割。

**対応内容:**
`JSON.stringify(key) === JSON.stringify(key)` によるO(n)探索を解消した。データ構造を `[QueryKey, EventPacket][]` から `Record<pubkey, { key: QueryKey; data: EventPacket }>` に変更し、キー検索をO(1)に改善。また `metadataChanged` フラグにより、変更がない場合は `setItem` を呼ばない。本変更はIndexedDB移行時に `pubkey` 単位での個別レコード保存に転用可能な構造となっている。

**残存リスク**

## 1回あたりの `JSON.stringify` / `JSON.parse` コストはデータ量に比例するため、フォロイー数が多い場合のシリアライズコストは残存する。IndexedDB移行により根本解決予定。`QuotaExceededError` 発生時はコンソールエラーを出力する。

### H-17. `nostr.ts` が948行の God Module

**カテゴリ:** アーキテクチャ
**ファイル:** `src/lib/func/nostr.ts`

RxNostr初期化、リレー管理、メタデータlocalStorage永続化、イベント公開、ページネーション付きリクエスト、メディアリクエストなど、極めて多くの責務を1ファイルに詰め込んでいる。50ファイルからimportされている。

**推奨修正:** `relay-manager.ts`, `metadata-cache.ts`, `event-publisher.ts`, `req-helpers.ts` 等に分割。

---

### H-18. テストカバレッジが極めて低い

**カテゴリ:** アーキテクチャ
**ファイル:** `src/lib/func/*.test.ts`

テストファイルは8つのみ（`event.test.ts`, `contentCheck.test.ts`, `content.test.ts`, `makezap.test.ts`, `markdonw.test.ts`, `searchQueryParser.test.ts`, `sortTest.test.ts`, `upload.test.ts`）。コンポーネントテスト、統合テスト、E2Eテストは存在しない。

**推奨修正:** 最優先で `operators.ts`, `muteCheck.ts` にテストを追加。`@testing-library/svelte` でコンポーネントテストも実施。

---

## MEDIUM (計画的に対応) — 21件

---

### M-1. StatusDisplay が Nostr の `link` を `href` に未検証で渡す

**カテゴリ:** セキュリティ
**ファイル:** `src/lib/components/NostrElements/kindEvents/Status/GeneralStatusDisplay.svelte:28-36`, `OtherStatusDisplay.svelte:25-37`

```svelte
<a href={link}>  <!-- checkSafe() なし -->
```

`Link.svelte` コンポーネント (Elements/Link.svelte) を経由しないため `checkSafe()` のバリデーションが適用されない。

**推奨修正:** Elements/Link.svelte を使用するか、同等のURL検証を適用。

---

### M-2. CDNスクリプトに SRI (Subresource Integrity) なし

**カテゴリ:** セキュリティ
**ファイル:** `src/app.html:15-18`

```html
<script
  type="module"
  src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
></script>
```

CDNが侵害された場合、任意のスクリプトが実行される。

**推奨修正:** `integrity="sha384-..."` と `crossorigin="anonymous"` を追加。

---

### M-3. `validateServerConfiguration` の delegated_to_url 検証ロジック反転 → Done

**カテゴリ:** バグ
**ファイル:** `src/lib/func/nip96.ts:219-221`

NIP-96では `delegated_to_url` 指定時に `api_url` が空でなければならないが、`api_url` が空文字列（falsy）の場合に先のチェックで既に `false` を返してしまう。

---

### M-4. ページネーション `until` が off-by-one で重複取得

**カテゴリ:** バグ
**ファイル:** `src/lib/func/nostr.ts:909-912`

```typescript
until = lastEvent.event.created_at; // 同じ created_at のイベントが次ページで重複
```

**推奨修正:** `until = lastEvent.event.created_at - 1;`

---

### M-5. `latestEachNaddr` で tags 空配列時に TypeError → Done

**カテゴリ:** バグ
**ファイル:** `src/lib/stores/operators.ts:110-117`

```typescript
({ event }) => `${event.kind}:${event.pubkey}:${event.tags[0][1]}`;
// tags が空配列の場合 TypeError
```

**推奨修正:** `event.tags.find(t => t[0] === "d")?.[1] ?? ""` を使用。

---

### M-6. `mute.ts` のタイムスタンプ比較が `>=` (同一イベントで上書き) → Done

**カテゴリ:** バグ
**ファイル:** `src/lib/func/mute.ts:22-26`

`>=` を使っているため、同じ `created_at`（同一イベント）でも上書き処理が走る。`>` が意図に沿う。

---

### M-7. `error: any` 型で `error.message` 直接アクセス

**カテゴリ:** TypeScript品質
**ファイル:** `src/lib/func/nostr.ts:490`, `src/lib/func/publishError.ts:13`

```typescript
} catch (error: any) {
  if (error.message.includes(...))  // error が string や null の場合にランタイムエラー
```

**推奨修正:** `error instanceof Error` でガード。

---

### M-8. `any` 型の広範な使用

**カテゴリ:** TypeScript品質
**ファイル:** 複数

- `Profile` の `[key: string]: any` — `src/lib/types.ts:117`
- `set3Relays(relays: any)` — `src/lib/func/reactions.ts:27`
- `filters: any` — `src/lib/func/nostr.ts:711-713`
- `MenuItem.icon: any` — `src/lib/types.ts:22`
- `FilterConfig[key: string]: any` — `src/lib/stores/ChunkManager.ts:18`

**推奨修正:** 具体的な型定義に置き換え。

---

### M-9. `ReqStatus` 型に `"nodata"` が未定義

**カテゴリ:** TypeScript品質
**ファイル:** `src/lib/types.ts:28`, `src/lib/func/nostr.ts:937`

```typescript
export type ReqStatus = "loading" | "success" | "error";
// 使用箇所:
status.set("nodata" as ReqStatus); // 型に含まれていない値をキャスト
```

**推奨修正:** `"nodata"` を `ReqStatus` 型に追加。

---

### M-10. `scanArray` が毎イベント全配列ソート O(n log n)

**カテゴリ:** パフォーマンス
**ファイル:** `src/lib/stores/operators.ts:148-162`

```typescript
const sorted = sortEventPackets([...acc, a]); // O(n log n) per event
```

500件蓄積後、毎回新しいイベントで500件のコピーとソートが走る。

**推奨修正:** `insertEventPacketIntoDescendingList` の問題を再調査し、binary insert (O(log n)) に変更。

---

### M-11. `muteCheck` が1回の呼び出しで `get(mutes)` を最大5回 → Done

**カテゴリ:** パフォーマンス
**ファイル:** `src/lib/func/muteCheck.ts:18-56`

ホットパス（全イベントに対して呼出）で `get()` が重複実行される。Svelte storeの `get()` は毎回一時サブスクリプションを作成する。

**推奨修正:** 先頭で1度だけ取得して引数として渡す。

---

### M-12. `Content.svelte` が `ContentParts` を常時2重インスタンス化 → 誤検知

**カテゴリ:** パフォーマンス
**ファイル:** `src/lib/components/NostrElements/content/Content.svelte:47-71`

`Truncate.svelte` の実装を確認した結果、`dialogContent` は `isTruncated === true` のブロック内にのみ存在するため、ダイアログ用 `ContentParts` は常時レンダリングされない。指摘の前提（常時2重インスタンス化）は誤り。

**対応:** 修正不要。ただし `ContentParts` の props 記述が重複しているため、可読性改善として snippet を引数付きに変更し1箇所に集約することは有効。

---

### M-13. OGPフェッチにレート制限なし

**カテゴリ:** パフォーマンス
**ファイル:** `src/lib/func/ogp.ts:27-42`

キャッシュ未命中時に表示中の全URLに対して同時にフェッチが発生。50投稿×2URL = 100件の同時リクエスト。

**推奨修正:** 同時実行数を制限するキュー（例: `p-limit`で5並列に制限）。

---

### M-14. Svelte 4 `writable` と Svelte 5 `$state` の混在

**カテゴリ:** アーキテクチャ
**ファイル:** `src/lib/stores/stores.ts`, `src/lib/stores/globalRunes.svelte.ts`

データアクセスが `$store`, `store.get()`, `.value` の3種類に分散し、認知負荷が高い。

**推奨修正:** 段階的にSvelte 5の `$state` ベースに統一。

---

### M-15. `[npub=npub]/+page.svelte` が770行 — Metadata+EventCard 5回重複 → Done

**カテゴリ:** アーキテクチャ
**ファイル:** `src/routes/[npub=npub]/+page.svelte`

同じ Metadata+EventCard パターンが5回以上コピーされている:

```svelte
<Metadata queryKey={["metadata", event.pubkey]} pubkey={event.pubkey}>
  {#snippet loading()}<div><EventCard note={event} /></div>{/snippet}
  {#snippet nodata()}<div><EventCard note={event} /></div>{/snippet}
  {#snippet error()}<div><EventCard note={event} /></div>{/snippet}
  {#snippet content({ metadata })}<EventCard {metadata} note={event} />{/snippet}
</Metadata>
```

**推奨修正:** `MetadataEventCard` 統合コンポーネントを作成。

**対応:** 別コンポーネント化は不要（このファイル内でのみ使用）。`metadataEventCard` snippet を定義し全箇所を `{@render metadataEventCard(event)}` に置換。reactions タブの `excludeKind7` は第2引数として渡す。

---

### M-16. `EventCard.svelte` 618行 — 20種kind の if/else チェイン

**カテゴリ:** アーキテクチャ
**ファイル:** `src/lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte`

31個のKindコンポーネントが静的にimportされている。

**推奨修正:** kindからコンポーネントへのMapレジストリパターン + 頻度の低いkindは動的import。

**推奨修正の実現可能性:** 各kindコンポーネントのpropsインターフェースが統一されていないため（`replyUsers`/`replyTag`/`excludefunc`/`onDelete`/snippet等がkindごとに異なる）、Mapレジストリパターンによるif/elseチェインの完全排除は困難。

有効な部分対応:

- 動的import化（`import()`）: バンドル分割のみ、チェインは残存
- 共通propsインターフェース設計: チェイン削除可能だが全kindコンポーネントの改修が必要

**判定:** アーキテクチャ改善のコストが高い割に実益が限定的。現状の可読性は if/else チェインで担保されており、修正優先度は低。

---

### M-17. `+error.svelte` 未設定 (エラーバウンダリなし)

**カテゴリ:** アーキテクチャ
**ファイル:** `src/routes/`

SvelteKitのデフォルトエラーページが表示される。Nostrクライアントではリレー通信エラーが頻繁に発生するため、グレースフルなエラー表示は重要。

---

### M-18. i18n に日本語ハードコード文字列が残存 → Done

**カテゴリ:** アーキテクチャ
**ファイル:** `src/lib/func/util.ts:154-171`, `src/lib/func/nostr.ts:491-498`

```typescript
"イベントデータのサイズが無効";
"署名がキャンセルされました";
```

**推奨修正:** i18nキーに置き換え。

---

### M-19. operators パイプライン内に副作用

**カテゴリ:** アーキテクチャ
**ファイル:** `src/lib/stores/operators.ts`

`metadata()`, `bookmark()`, `userStatus()`, `saveEachNote()`, `reactionCheck()` が `tap`/`filter` 内でストア書き込み、localStorage更新、キャッシュ更新を行う。

**推奨修正:** 副作用は `subscribe` 側で実行。

---

### M-20. `saveMetadataToLocalStorage` で O(n) の JSON.stringify 線形探索

**カテゴリ:** パフォーマンス
**ファイル:** `src/lib/func/nostr.ts:191-225`

フォロイー500人で各メタデータ更新時に最大500回の `JSON.stringify` ペア比較。

**推奨修正:** `Map<string, [QueryKey, EventPacket]>` でO(1)ルックアップ。

---

### M-21. `MainTimeline.svelte` で `$derived` 内の `useMainTimeline` が再実行リスク

**カテゴリ:** パフォーマンス
**ファイル:** `src/lib/components/renderSnippets/nostr/MainTimeline.svelte:136-138`

```typescript
let result = $derived(useMainTimeline(queryKey, configureOperators(), filters));
```

`$derived` の再計算時に新しい `createQuery` インスタンスが生成される可能性。

---

## LOW (改善推奨) — 11件

---

### L-1. `constants.ts` タイポ `endoiunt` → `endpoint`

**ファイル:** `src/lib/func/constants.ts:33`

```typescript
export const monoZap = {
  endoiunt: "https://...",  // "endpoint" のタイポ
```

---

### L-2. `console.log` が本番コードに331箇所残存

**ファイル:** 84ファイル

`settings.ts` (21件), `nostr.ts` (18件), `NostrMain.svelte` (18件) が特に多い。リレーURL、フィルター条件、内部処理状態が出力される。

**推奨修正:** ビルド時に除去するか、`import.meta.env.DEV` でガード。

---

### L-3. NIP-05 の `"Failed to fetch"` を CORS エラーと誤分類

**ファイル:** `src/lib/func/nip05.ts:66-69`

"Failed to fetch" はネットワーク断絶、DNS解決失敗などCORS以外でも発生する。

---

### L-4. `nip96.ts` で元の例外情報を破棄

**ファイル:** `src/lib/func/nip96.ts:263`

```typescript
} catch (_) {
  throw new Error(`Error fetching.`);
}
```

元のエラー情報（URL、ステータスコード）が失われる。

---

### L-5. `upload.ts` で不正な `as FileUploadResponse` キャスト

**ファイル:** `src/lib/func/upload.ts:487-530`

エラーオブジェクトに `nip94_event` フィールドが欠けているため型定義を満たしていない。

---

### L-6. テストファイル名にタイポ `markdonw.test.ts`

**ファイル:** `src/lib/func/markdonw.test.ts`

---

### L-7. `@melt-ui/svelte` と `melt` の二重依存

**ファイル:** `package.json`

Svelte 4時代の `@melt-ui/svelte` とSvelte 5対応版の `melt` が共存。移行途中。

---

### L-8. `viewMediaModal.subscribe()` のクリーンアップなし

**ファイル:** `src/routes/+layout.svelte:117-125`

返り値のunsubscribe関数が保存・呼び出しされていない。ルートレイアウトなので実際的問題は小さい。

---

### L-9. `createCustomStore` が Svelte store contract の再発明

**ファイル:** `src/lib/stores/globalRunes.svelte.ts:41-63`

`$state.raw` ベースで独自subscriptionメカニズムを持つ。Svelteのリアクティビティと二重通知のリスク。

---

### L-10. LNURL ドメインの検証不足

**ファイル:** `src/lib/func/zap.ts:88-134`

`lud16: "attacker@127.0.0.1"` のような値でローカルホストへのリクエストが発生。クライアントサイドなので直接的サーバー影響はないが、内部ネットワークスキャンに悪用される可能性。

---

### L-11. OGP meta タグへの Nostr イベントコンテンツ直接出力

**ファイル:** `src/routes/[note=note]/+page.server.ts:130`

Svelteのデフォルトエスケープが適用されるため直接XSSにはならないが、`</meta><script>` のような文字列が含まれる可能性を考慮。

---

## 優先対応ロードマップ

### Phase 1: 緊急 (即座に)

1. **SSRF修正** — `url-check` と `ogp` にプロトコル制限 + プライベートIPブロック
2. **CSRF修正** — `trustedOrigins: ["*"]` を具体的オリジンに変更
3. **rxNostr3 reconnectバグ** — 1行修正
4. **NostrElements 条件反転** — `<= 0` → `> 0`
5. **fetchOgpContent のnullチェック追加**

### Phase 2: 短期 (1-2週間)

6. セキュリティヘッダー追加 (`hooks.server.ts`)
7. `allowedOrigins` のトレーリングスラッシュ修正
8. `markdown-it-link.ts` にプロトコル検証追加
9. 空catchブロックにログ追加
10. `eruda` の本番除外
11. `observedEvents` / `tieMap` にLRU上限
12. キャッシュキー不一致修正 (`zap.ts`)

### Phase 3: 中期 (1ヶ月)

13. `nostr.ts` の God Module 分割
14. 配列ミューテーション → イミュータブルパターン
15. テスト拡充 (operators, muteCheck)
16. Metadata+EventCard 共通コンポーネント抽出
17. LocalStorage → IndexedDB (メタデータ)
18. Observable サブスクリプションのクリーンアップ

### Phase 4: 長期 (四半期)

19. Svelte 4 store → Svelte 5 $state 統一
20. EventCard レジストリパターン化
21. `+error.svelte` エラーバウンダリ追加
22. i18nハードコード文字列の置き換え

---

_Generated by parallel static analysis with 5 specialized audit agents_

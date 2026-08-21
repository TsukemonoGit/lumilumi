# 投稿に eHagaki 埋め込みウィンドウを使用する機能 追加手順書

## 1. 目的

投稿ボタン(OpenPostWindow)をクリックしたとき、設定で選択していれば標準の投稿フォーム(CreatePost)の代わりに
[eHagaki](https://github.com/Lokuyow/ehagaki) を iframe 埋め込みで表示し、eHagaki 上で投稿を作成できるようにする。

設定ページには「投稿にeHagakiを使用する」メニューを追加し、**標準の投稿機能 / eHagaki 使用** を選択可能にする。

対応必須要件(スコープから外さない):

1. **リプライ / 引用 / パブリックチャット(context)の引継ぎ** — lumilumi から開いたとき `reply=` / `quote=` / `channel=` / `content=` に変換して渡す
2. **lumilumi の署名設定での代理署名** — eHagaki からの `signEvent` 要求を lumilumi と同じ `nip07Signer()`(NIP-07)で署名して返す。秘密鍵は一切渡さない
3. **storage / IndexedDB 委譲** — iOS Safari(PWA)で iframe 内 storage が使えない環境でも動作するよう `storage.*` / `idb.*` に応答する

参照: [eHagaki iframe埋め込みガイド](https://github.com/Lokuyow/ehagaki/blob/main/docs/IFRAME_EMBEDDING.md)

---

## 2. 現状の構成(調査結果)

| 要素 | ファイル | 内容 |
|---|---|---|
| 投稿ボタン+投稿ダイアログ | `src/lib/components/OpenPostWindow.svelte` | FAB ボタン(`use:melt={$trigger}`, L323)と Melt-UI ダイアログ(L334)。`N` キー(L240)、`postWindowOpen` ストア経由(L247)の両方で開く。ダイアログ内は `<CreatePost>`(L349) |
| プログラム的に開く経路 | `src/lib/stores/stores.ts:59` の `postWindowOpen` | 下記 4 箇所から `additionalPostOptions` + `postWindowOpen.set(true)` で開かれる |
| リプライ(ノート) | `NoteActionButtons.svelte:361` `onClickReplyIcon` | tags: `["p", 作者]` + root(`["e"\|"a", id, relay, "root"]`) + `[..., "reply"]`(NIP-10)。kind 1 / 42 |
| リプライ(ユーザー/チャンネル) | `ReplyToUserButton.svelte:16` | tags: `["p", pubkey]`(+ チャンネルなら `["e", channelId, "", "root"]` で kind 42) |
| 引用 | `NoteActionButtons.svelte:249` | `content` に `` ` nostr:${nevent\|naddr} \n` `` を埋め込み、`addableUserList` に作者 |
| 共有ターゲット | `src/routes/post/+page.svelte:88,115,201` | content のみ(+ メディアなら imeta タグ) |
| 署名 | 全コード共通 | `rx-nostr` の `nip07Signer()`(NIP-07 `window.nostr`。拡張が無ければ `@konemono/nostr-login` が提供)。OpenPostWindow では `sendEvent`(L122)で使用し、`lumiSetting.protectedEvents` なら `["-"]` タグ、`addClientTag` なら client tag を追加 |
| 設定型 | `src/lib/types.ts:129` `LumiSetting` | boolean フィールドが並ぶ |
| 既定値 | `src/lib/func/constants.ts:73` `initSettings` | |
| 設定画面 | `SettingsElements/Settings.svelte` → `<PostSettings bind:settings />` | checkbox + `bind:checked={settings.xxx}` のパターン(PostSettings.svelte L82-89) |
| 永続化 | localStorage `lumiSetting` → 起動時に `NostrMain.svelte` の `isValidLumiSetting`(L133)/`applySavedSettings`(L218) で検証・反映 | boolKeys の厳密チェックあり。旧フィールド欠落に備え `embed` は意図的に除外済み(L160 コメント) |
| i18n | `src/lib/i18n/locales/{en,ja}.json` の `settings.post.*` | |

## 3. eHagaki iframe 仕様の要点

- 埋め込み URL: `https://lokuyow.github.io/ehagaki/?parentOrigin=<親オリジンをURLエンコード>`
- iframe 属性: `allow="local-network-access; local-network; loopback-network"`(ローカル relay 対応。未対応ブラウザは無視)
- メッセージ形式: `{ namespace: "ehagaki.embed", version: 1, type, requestId?, payload }`
- 受信時は必ず **`event.origin === "https://lokuyow.github.io"` と `event.source === iframe.contentWindow` の両方を検証**
- 応答系メッセージは受信した `requestId`(non-empty)をそのままエコーする
- ログイン委譲の流れ: iframe が `ready` → 親がログイン済みなら `auth.login{pubkeyHex}` → iframe から `auth.request` → 親が `auth.result{pubkeyHex, capabilities:["signEvent"]}` / `auth.error` → 以降 `rpc.request(method:"signEvent")` に `rpc.result{result:署名済みevent}` / `rpc.error` で応答
- `auth.login` だけではログイン完了しない。続く `auth.request` への応答が必須
- 未対応 method には machine-readable な `code` 付き `rpc.error`
- context(URLクエリ): `reply=nevent1...`(1件のみ)、`quote=note1.../nevent1...`(複数可・重複排除)、`channel=nevent1...` + `channelRelays=wss://,...` + `channelName/About/Picture`、`content=...`(同時指定可。nevent には relay hint 推奨)
- 設定注入(URLクエリ): `embedTheme=system|light|dark`, `embedLocale=ja|en` ほか(`embed~`=毎回強制 / `default~`=未保存時のみ)
- storage 委譲: 子から `storage.get/set/remove` → 親が `storage.result` / `storage.error` を同一 `requestId` で返す。キーは allowlist のみ(locale, themeMode, darkMode, clientTagEnabled, ... settingsPreferenceMetadata, firstVisit, sharedMediaProcessed)。親側は prefix を付けた localStorage に保存
- IndexedDB 委譲: `idb.getSnapshot` / `idb.setSnapshot`(store: `uploadDestinations`, scopeKey: `__ehagaki_global__`)→ `idb.result` / `idb.error`。未保存なら `records` を省略
- 投稿結果: `post.success{timestamp,eventId,replyToEventId?,quotedEventIds?}` / `post.error{timestamp,code,message?}`

## 4. 設計方針

1. **分岐は OpenPostWindow のダイアログ内で行う**
   FAB クリック / `N` キー / `postWindowOpen` ストア、すべてのオープン経路がそのまま使える。
   `lumiSetting.value.useEhagaki` が `true` なら `<CreatePost>` の代わりに新規コンポーネント `<EhagakiPostWindow>` を描画する。
2. **設定は既存の LumiSetting に 1 フィールド追加**(`useEhagaki: boolean`、既定 `false`)。
   自動保存($effect, debounce 300ms)・localStorage 永続化・グローバル rune 反映は既存機構を流用。
3. **都度生成 iframe 方式**(ガイド「都度生成 iframe の設定注入」準拠):
   ダイアログを開くたびに `{#if $open}` で unmount/mount されるため、毎回 URL クエリで context・設定を注入する。常時表示方式(`composer.setContext`)は不要。
4. **署名は lumilumi に統一**: eHagaki 内での独立ログイン(nsec 直接入力)はフォールバックとして残しつつ、`ready` 直後に `auth.login` で lumilumi の NIP-07 signer に委譲する。標準フローと同じポリシー(`protectedEvents` → `["-"]`、`addClientTag` → client tag)を `signEvent` 応答時に適用する。
5. **sandbox は付けない**(EmbedSuno とは異なる判断)。ただし storage 委譲により iOS Safari でも動作させる。origin/source 検証は厳格に行う。

---

## 5. 実装手順

### Step 1: 型定義にフィールドを追加

`src/lib/types.ts` — `LumiSetting`(L129)に追加:

```ts
export interface LumiSetting {
  // ...既存フィールド...
  protectedEvents: boolean; //NIP-70
  useEhagaki: boolean; //投稿にeHagaki埋め込みを使用
}
```

### Step 2: 既定値を追加

`src/lib/func/constants.ts` — `initSettings`(L73)に追加:

```ts
export const initSettings: LumiSetting = {
  // ...
  protectedEvents: false, //NIP-70
  useEhagaki: false, //投稿にeHagaki埋め込みを使用
};
```

### Step 3: 後方互換性対応(重要)

古い localStorage データには `useEhagaki` が存在しないため:

- `NostrMain.svelte` の `boolKeys`(L158-170)には **`useEhagaki` を追加しない**
  (`embed` と同じ理由。L160 のコメント先例。boolKeys に入れると旧データの検証が全部失敗する)
- `applySavedSettings`(L218)に防御的デフォルトを追加:

```ts
if (typeof lumiSetting.value.useEhagaki !== "boolean") {
  lumiSetting.value.useEhagaki = false;
}
```

### Step 4: i18n ラベル追加

`ja.json` の `settings.post` 配下:

```json
"useEhagaki": "投稿にeHagakiを使用する",
"useEhagakiDesc": "投稿ボタンでeHagakiの埋め込みウィンドウを開きます。署名はこのアプリの設定(NIP-07)で行われます。オフの場合は標準の投稿フォームを使用します。"
```

`en.json` の `settings.post` 配下:

```json
"useEhagaki": "Use eHagaki for posting",
"useEhagakiDesc": "The post button opens an embedded eHagaki window. Signing uses this app's signer (NIP-07). When off, the standard post form is used."
```

### Step 5: 設定画面にメニュー追加

`src/lib/components/SettingsElements/PostSettings.svelte` — 既存 checkbox パターン(L82-89)に倣い、`protectedEvents` ブロックの後ろへ:

```svelte
<label class="flex items-center gap-3 cursor-pointer">
  <input type="checkbox" class="rounded-checkbox" bind:checked={settings.useEhagaki} />
  <span class="">{$_("settings.post.useEhagaki")}</span>
</label>
<p class="text-xs text-neutral-500">{$_("settings.post.useEhagakiDesc")}</p>
```

※ 自動保存は `Settings.svelte` の debounce $effect が既存どおり処理するため保存処理の追記は不要。

### Step 6: eHagaki 連携モジュールを新規作成

新規: `src/lib/func/ehagaki.ts`

#### 6-1. 定数・型・ガード

```ts
export const EHAGAKI_ORIGIN = "https://lokuyow.github.io";
export const EHAGAKI_EMBED_NS = "ehagaki.embed";

export type EhagakiEmbedMessage = {
  namespace: typeof EHAGAKI_EMBED_NS;
  version: 1;
  type: string;
  requestId?: string;
  payload?: any;
};

export function isEhagakiMessage(data: unknown): data is EhagakiEmbedMessage {
  const m = data as EhagakiEmbedMessage;
  return !!m && m.namespace === EHAGAKI_EMBED_NS && m.version === 1 && typeof m.type === "string";
}
```

#### 6-2. context 変換(tags → nevent / 引用抽出)

`AdditionalPostOptions`(`MargePostOptions`)から eHagaki context を生成する純関数:

```ts
import * as nip19 from "nostr-tools/nip19";

export interface EhagakiContext {
  reply?: string;        // nevent1...
  quotes: string[];      // nevent1... / note1...(重複排除)
  channel?: { reference: string; relays: string[] }; // kind 42 用
  content: string;       // 引用URIを取り除いた本文
}

export function buildEhagakiContext(init: MargePostOptions): EhagakiContext
```

変換ルール:

- **リプライ先**:
  - `init.tags` からマーカー `"reply"` の `e` タグを探す。無ければマーカーなしの最後の `e` タグ(NIP-10 旧形式)、それも無ければ `"root"` の `e` タグ
  - `nip19.neventEncode({ id: tag[1], relays: [tag[2]] のうち wss:// から始まるもの, author: init.defaultUsers?.[0], kind: init.kind === 42 ? 42 : 1 })`
  - kind 42(パブ茶)の場合はリプライではなく **channel** 扱い: `"root"` の `e` タグを `channel.reference` の nevent に、`tag[2]` を `channel.relays` にする(name/about/picture は省略し eHagaki 側の DB / kind 40 補完に任せる)
- **引用**:
  - `init.content` から `/nostr:(nevent1|note1)[023456789acdefghjklmnpqrstuvwxyz]+/g` でトークンを抽出し `quotes` へ(event id で重複排除)、**元の本文からは取り除く**(eHagaki 側で q タグ化されるため二重引用を防ぐ)
  - `naddr1...` は eHagaki の `quote=` が対応しないため本文に残す
- **失敗時**: decode/encode 例外は try-catch で握って該当要素をスキップ(投稿を妨げない)

#### 6-3. URL 生成

```ts
export function buildEhagakiUrl(ctx: EhagakiContext, opts: { theme?: string; locale?: string }): string {
  const url = new URL("/ehagaki/", EHAGAKI_ORIGIN);
  url.searchParams.set("parentOrigin", window.location.origin);
  if (ctx.reply) url.searchParams.set("reply", ctx.reply);
  for (const q of ctx.quotes) url.searchParams.append("quote", q);
  if (ctx.channel) {
    url.searchParams.set("channel", ctx.channel.reference);
    if (ctx.channel.relays.length) url.searchParams.set("channelRelays", ctx.channel.relays.join(","));
  }
  if (ctx.content) url.searchParams.set("content", ctx.content);
  if (opts.theme) url.searchParams.set("embedTheme", opts.theme);   // system|light|dark
  if (opts.locale) url.searchParams.set("embedLocale", opts.locale); // ja|en
  return url.toString();
}
```

#### 6-4. storage 委譲ヘルパー

- prefix: `const STORAGE_PREFIX = "ehagaki.embed.storage.v1:";`
- allowlist はガイドどおり(`locale`, `themeMode`, `darkMode`, `clientTagEnabled`, `quoteNotificationEnabled`, `replyNotificationEnabled`, `imageQualityLevel`, `videoQualityLevel`, `imageCompressionLevel`, `videoCompressionLevel`, `mediaFreePlacement`, `showMascot`, `showFlavorText`, `settingsPreferenceMetadata`, `firstVisit`, `sharedMediaProcessed`)
- `handleStorageGet/Set/Remove(msg)` → `localStorage` 操作 → 戻り値として `storage.result` / `storage.error` メッセージオブジェクトを返す(送信はコンポーネント側)
- allowlist 外キーや非文字列値は `storage.error`(code: `storage_parent_failed`)

#### 6-5. IndexedDB 委譲ヘルパー

- DB 名: `ehagaki.embed.parent.v1`、object store: `uploadDestinations`、キー: `scopeKey`
- `idb.getSnapshot` → 保存済み `records` を返す(未保存なら `records` 省略の `idb.result`)
- `idb.setSnapshot` → `payload.records` をそのまま保存して `idb.result`
- ストア名・scopeKey が想定外なら `idb.error`

### Step 7: 埋め込み投稿ウィンドウコンポーネントを新規作成

新規: `src/lib/components/Ehagaki/EhagakiPostWindow.svelte`

```ts
interface Props {
  initOptions: MargePostOptions; // OpenPostWindow が保持する初期オプションをそのまま渡す
  onClose: () => void;           // post.success 時にダイアログを閉じる
}
```

#### 7-1. 描画

- `buildEhagakiUrl(buildEhagakiContext(initOptions), { theme, locale })` を `src` に設定
  - `theme` は lumilumi のテーマ設定(light/dark/system)、`locale` は現在の i18n ロケール(ja/en)
- `<iframe bind:this={iframe} title="eHagaki" class="w-full h-[70vh]" allow="local-network-access; local-network; loopback-network">`

#### 7-2. メッセージハンドラ(単一の `message` リスナー)

検証順序(省略禁止):
1. `event.origin !== EHAGAKI_ORIGIN` → 無視
2. `!iframe || event.source !== iframe.contentWindow` → 無視
3. `isEhagakiMessage(event.data)` でない → 無視
4. `type` ごとに分岐(未知 type は `console.warn` して無視)

分岐:

| type | 処理 |
|---|---|
| `ready` | `getPubkey()`(下記)が成功していれば `auth.login { payload: { pubkeyHex } }` を送信(再接続時の再同期も兼ねる) |
| `auth.request` | `getPubkey()` 成功 → `auth.result { requestId, payload: { pubkeyHex, capabilities: ["signEvent"] } }`。失敗 → `auth.error { requestId, payload: { code: "parent_client_not_logged_in" } }` |
| `rpc.request` | `payload.method === "signEvent"` のみ処理(下記 7-3)。それ以外は `rpc.error { code: "unsupported_method" }` |
| `post.success` | 成功トースト + `onClose()` |
| `post.error` | エラートースト(code 表示)。ウィンドウは開いたまま |
| `storage.get/set/remove` | Step 6-4 のヘルパーで応答メッセージ生成 → `postToIframe` |
| `idb.getSnapshot/setSnapshot` | Step 6-5 のヘルパーで応答 |

- `postToIframe(msg)` は必ず `iframe.contentWindow.postMessage(msg, EHAGAKI_ORIGIN)` で送る(targetOrigin 指定必須)
- `$effect` でリスナー登録、クリーンアップで `removeEventListener`

#### 7-3. signEvent 応答(lumilumi の署名設定を適用)

```ts
async function handleSignEvent(req: EhagakiEmbedMessage): Promise<EhagakiEmbedMessage> {
  const event = req.payload?.params?.event;
  // event shape 検証: pubkey/created_at/kind/tags/content が揃っていること
  if (!isValidEventParameters(event)) return rpcError(req, "invalid_event");

  const newevent = { ...event, tags: [...(event.tags ?? [])] };

  // lumilumi の標準フロー(handleSendEvent)と同じポリシーを適用
  if (lumiSetting.value.protectedEvents && !newevent.tags.some((t) => t[0] === "-")) {
    newevent.tags.unshift(["-"]);
  }
  if (lumiSetting.value.addClientTag && !newevent.tags.some((t) => t[0] === "client")) {
    newevent.tags.push(clientTag);
  }

  try {
    const signer = nip07Signer(); // OpenPostWindow.sendEvent と同一の署名経路
    const signed = await signer.signEvent(newevent);
    return { namespace: NS, version: 1, type: "rpc.result", requestId: req.requestId!, payload: { result: signed } };
  } catch (error) {
    return { namespace: NS, version: 1, type: "rpc.error", requestId: req.requestId!, payload: { code: "rpc_failed", message: String(error) } };
  }
}
```

- `requestId` は空文字チェックの上、そのままエコー
- `nip44.*` は要求されても `unsupported_method` を返す(現行 eHagaki の必須 capability は `signEvent` のみ)

#### 7-4. 公開鍵取得

```ts
async function getPubkey(): Promise<string | null> {
  if (loginUser.value) return loginUser.value;          // OpenPostWindow.getSignPubkey と同じ優先順
  const pubkey = await window.nostr?.getPublicKey().catch(() => null);
  if (pubkey) loginUser.value = pubkey;
  return pubkey;
}
```

- 未ログインでも eHagaki 側の独自ログイン UI が iframe 内で使えるため、`auth.error` を返せばよい(機能停止ではない)

### Step 8: OpenPostWindow に分岐を組み込む

`src/lib/components/OpenPostWindow.svelte`:

1. import 追加: `import EhagakiPostWindow from "./Ehagaki/EhagakiPostWindow.svelte";`
2. ダイアログ内(L349 の `<CreatePost ... />`)を条件分岐:

```svelte
{#if lumiSetting.value.useEhagaki}
  <div class="p-2">
    <EhagakiPostWindow {initOptions} onClose={() => ($open = false)} />
  </div>
{:else}
  <CreatePost ... />
{/if}
```

3. eHagaki 使用時の挙動調整:
   - オーバーレイクリック(`handleOverlayClick`)は textarea 前提のため、eHagaki モードでは確認なしで `$open = false`
   - `open.subscribe` 内の `getSignPubkey()` は eHagaki モードではスキップしてよい(EhagakiPostWindow 側で取得するため)
   - 「大量リプライ確認」(`bulkReplyThreshold`)は CreatePost フロー専用のため eHagaki モードでは適用外(eHagaki 側の通知タグ制御に任せる)

### Step 9: 動作確認

1. `npm run check`(型チェック)+ `npm run dev`
2. 確認項目:
   - [ ] 設定 → 投稿設定に「投稿にeHagakiを使用する」が表示され、トグルで保存される(リロード後も維持)
   - [ ] OFF: 従来どおり CreatePost(FAB / `N` キー / リプライ・引用ボタン / `/post` 共有ターゲット)
   - [ ] ON: 上記すべての経路で eHagaki iframe が開く
   - [ ] **署名委譲**: NIP-07 ログイン済み状態で eHagaki を開く → 拡張の署名ダイアログを経由して投稿でき、イベントの client tag / `-`(protected)が lumilumi 設定どおり付く。eHagaki 内に nsec を入力せずに投稿できること
   - [ ] **リプライ**: ノートのリプライボタン → eHagaki がリプライモードで開き、宛先が正しいこと(root/reply、kind 42 パブ茶も)
   - [ ] **引用**: 引用ボタン → 本文から `nostr:nevent1...` が消え、eHagaki 側で引用カードとして表示されること(naddr 引用は本文インラインのまま)
   - [ ] **共有ターゲット**: `/post` 経由で content が初期入力されること(imeta 付きメディア共有も)
   - [ ] `post.success` でウィンドウが閉じタイムラインに反映 / `post.error` でトースト表示
   - [ ] **storage 委譲**: 親の localStorage に `ehagaki.embed.storage.v1:*` キーが作られること(iOS Safari でもテーマ・言語が維持されること)
   - [ ] 古い localStorage(lumiSetting に useEhagaki なし)でも正常起動し設定は OFF
   - [ ] 未ログイン(NIP-07 無効)でも iframe 内 eHagaki 単体のログインで投稿できる(フォールバック)

---

## 6. セキュリティ上の注意

- `event.origin` / `event.source` の二重検証、`namespace` / `version` / `type` の allowlist 検証を省略しない(ガイドの必須条件)
- 秘密鍵は親から iframe へ一切渡さない(`auth.login` で渡すのは公開鍵のみ)。署名は `rpc.request` 経由でだけ行う
- `signEvent` の event shape は必ず検証してから署名する
- `requestId` は空文字を許可せず、応答系メッセージでそのままエコー
- storage 委譲は allowlist キーのみ・文字列値のみを受け付ける。prefix で他アプリのキーと衝突させない
- iframe に `sandbox` を付けない(localStorage/IndexedDB/ログインが壊れる)。代わりに origin 検証と storage 委譲で担保

## 7. 実装順序の推奨(コミット分割案)

1. Step 1-5: 設定トグル(まだ分岐なし、挙動は変わらない)
2. Step 6-1〜6-3 + 7-1 + 8: 埋め込み表示 + context 引継ぎ(reply/quote/channel/content)
3. Step 7-2〜7-4: auth / rpc 署名委譲
4. Step 6-4〜6-5: storage / IndexedDB 委譲(iOS Safari 対策)
5. Step 9: 総合テスト

## 8. 参考: 使わない方式(将来の選択肢)

- 常時表示 iframe + `composer.setContext` / `composer.contextUpdated`: 今回は都度生成方式のため不使用。将来「下書き保持したまま context だけ差し替え」が必要になったら移行を検討
- `nip44.*` capability: eHagaki が NIP-17 系フローで要求してきた場合のみ追加対応

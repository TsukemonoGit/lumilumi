# イベント絵文字メニュー機能 プラン

## 概要

EventCard の content にカスタム絵文字（`:shortcode:`）が含まれている場合、既存の `...`（ellipsis）メニューに「絵文字情報」メニュー項目を追加。クリックすると Dialog モーダルが開き、◀▶ボタンで1つずつ絵文字を切り替えて表示する。

## 前提条件

- `@konemono/nostr-content-parser` に `atag` 対応が追加済みであること
- parser の `CUSTOM_EMOJI` token が `metadata.atag` を持つこと

## 変更ファイル一覧

| #   | ファイル                                                                               | 変更内容                            |
| --- | -------------------------------------------------------------------------------------- | ----------------------------------- |
| 1   | `src/lib/components/NostrElements/kindEvents/NoteActionButtuns/EllipsisMenu.svelte`    | 絵文字メニュー項目の追加 + ハンドラ |
| 2   | `src/lib/components/NostrElements/kindEvents/NoteActionButtuns/EmojiInfoDialog.svelte` | **新規** - 絵文字情報モーダル       |
| 3   | `src/lib/i18n/locales/ja.json`                                                         | i18n キー追加                       |
| 4   | `src/lib/i18n/locales/en.json`                                                         | i18n キー追加                       |
| 5   | `package.json`                                                                         | content-parser バージョン更新       |

## データ構造

### 絵文字タグ（Nostr event tags）

```
["emoji", "cat", "https://.../cat.png"]                    ← atag なし
["emoji", "dog", "https://.../dog.png", "30030:abc:def"]   ← atag あり
```

- 各絵文字ごとに `atag` は異なる（or なし）
- `atag` は絵文字セット（kind 30030）への参照

### parser 出力（content-parser 更新後）

```typescript
// CUSTOM_EMOJI token
{
  type: "custom_emoji",
  content: ":cat:",
  metadata: {
    name: "cat",
    url: "https://.../cat.png",
    hasMetadata: true,
    atag: "30030:abc:def"  // 未定義の場合は undefined
  }
}
```

## 画面設計

### メニュー（... ボタン内）

```
┌──────────────────────────┐
│ 表示 >                    │
│ コピー/共有 >             │
│ アクション >              │
│ 外部サービス >            │
│ ──────────────            │
│ ★ 絵文字情報  ← 新規追加  │  (絵文字が1つ以上ある場合のみ表示)
│ ──────────────            │
│ ...                      │
└──────────────────────────┘
```

### モーダル（Dialog）

```
┌──────────────────────────────────────────────────┐
│  ✕                                               │
│                                                  │
│     ◀  [ cat ]  ▶                     1 / 3      │
│                                                  │
│           ┌─────────────────────┐                │
│           │                     │                │
│           │     🐱              │                │
│           │   (大きな画像)       │                │
│           │                     │                │
│           └─────────────────────┘                │
│                                                  │
│     name: cat                                    │
│     url: https://cdn.example.com/cat.png         │
│                                                  │
│     ┌── 絵文字セット情報 ─────────────────────┐   │
│     │ タイトル: 猫セット                       │   │
│     │ (atag から kind 30030 イベントを取得)    │   │
│     │                                         │   │
│     │ [自分のリストに追加]                     │   │
│     │ ── または ──                            │   │
│     │ [リストから削除]                         │   │
│     └─────────────────────────────────────────┘   │
│                                                  │
│     ※ atag がない絵文字の場合、このセクションは   │
│       非表示                                     │
│                                                  │
└──────────────────────────────────────────────────┘
```

## 実装設計

### 1. EllipsisMenu.svelte

#### 絵文字トークンの抽出

parser のヘルパー関数 `getCustomEmojis()` を使用（手動フィルターではなく）。

```typescript
import {
  parseContent,
  getCustomEmojis,
} from "@konemono/nostr-content-parser";

// content をパースして CUSTOM_EMOJI token を抽出（重複除去）
let emojiTokens = $derived.by(() => {
  const text = note?.content || "";
  const tags = note?.tags || [];
  const parts = parseContent(text, tags);
  const all = getCustomEmojis(parts));
  // 同じ shortcode が複数回出現する場合の重複除去（name ベース）
  const seen = new Set<string>();
  return all.filter((p) => {
    if (seen.has(p.metadata.name)) return false;
    seen.add(p.metadata.name);
    return true;
  });
});
```

#### メニュー項目の追加

```typescript
// menuGroups を構築する内側で
if (emojiTokens.length > 0) {
  actionItems.push({
    text: $_("menu.action.emojiInfo"),
    icon: Smile,
    action: "emoji_info",
  });
}
```

#### ハンドラ

```typescript
case "emoji_info":
  $modalState = {
    isOpen: true,
    component: EmojiInfoDialog,
    props: { emojiTokens },
  };
  break;
```

### 2. EmojiInfoDialog.svelte（新規）

`Modal.svelte` 経由で表示。`ModalJson` と同じパターン。

#### Props

```typescript
import type { Token } from "@konemono/nostr-content-parser";

type EmojiToken = Extract<
  Token,
  { type: "custom_emoji"; metadata: { hasMetadata: true } }
>;

interface Props {
  emojiTokens: EmojiToken[];
}

let { emojiTokens }: Props = $props();
```

#### 状態管理

```typescript
let currentIndex = $state(0);
let currentToken = $derived(emojiTokens[currentIndex]);
let currentATag = $derived(currentToken.metadata.atag);
```

#### ナビゲーション（MediaDisplay.svelte の ◀▶ パターンを参考）

```typescript
function goToNext() {
  if (emojiTokens.length > 0) {
    currentIndex = (currentIndex + 1) % emojiTokens.length;
  }
}

function goToPrev() {
  if (emojiTokens.length > 0) {
    currentIndex = (currentIndex - 1 + emojiTokens.length) % emojiTokens.length;
  }
}
```

#### 絵文字セット情報（atag がある場合のみ）

```typescript
import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
import { parseNaddr } from "$lib/func/util";

let naddr = $derived(currentATag ? parseNaddr(["a", currentATag]) : undefined);

// $emojis.event.tags に ["a", currentATag] があるか
let isInMyList = $derived(
  $emojis.event?.tags.some((tag) => tag[0] === "a" && tag[1] === currentATag) ??
    false,
);
```

- `naddr` を使い `LatestEvent` で kind 30030 イベントを取得
- タイトル/説明を表示
- 追加/削除ボタン（`Kind30030Note.svelte` の `handleClickAdd` / `handleClickRemove` を再利用）

#### テンプレート構成

```svelte
<!-- ◀ 名前 ▶ ナビゲーション（循環ナビゲーション: MediaDisplay と同様） -->
<div class="flex items-center gap-4">
  <button onclick={goToPrev}>
    <ChevronLeft />
  </button>
  <span class="text-lg font-bold">{currentToken.metadata.name}</span>
  <button onclick={goToNext}>
    <ChevronRight />
  </button>
</div>

<!-- 絵文字画像 -->
<img
  src={currentToken.metadata.url}
  alt={currentToken.content}
  class="max-h-32 object-contain"
/>

<!-- name / url -->
<div class="text-sm">
  <div>name: {currentToken.metadata.name}</div>
  <div class="break-all">url: {currentToken.metadata.url}</div>
</div>

<!-- 絵文字セット情報（atag がある場合のみ） -->
{#if currentATag && naddr}
  <LatestEvent
    queryKey={["naddr", `${naddr.kind}:${naddr.pubkey}:${naddr.identifier}`]}
    filters={[
      naddr.identifier !== ""
        ? { kinds: [naddr.kind], authors: [naddr.pubkey], "#d": [naddr.identifier] }
        : { kinds: [naddr.kind], authors: [naddr.pubkey] }
    ]}
  >
    {#snippet loading()}
      <div class="text-sm text-neutral-400">loading...</div>
    {/snippet}
    {#snippet nodata()}
      <div class="text-sm text-neutral-400">not found</div>
    {/snippet}
    {#snippet error()}
      <div class="text-sm text-neutral-400">error</div>
    {/snippet}
    {#snippet success({ event })}
      <!-- タイトル/説明表示 + 追加/削除ボタン -->
      <div class="border rounded p-2 mt-2">
        <div class="text-sm font-bold">{event.tags.find((t) => t[0] === "title")?.[1] ?? naddr.identifier}</div>
        {@const desc = event.tags.find((t) => (t[0] === "description" || t[0] === "summary") && t.length > 1)?.[1]}
        {#if desc}
          <div class="text-xs text-neutral-400">{desc}</div>
        {/if}
        <!-- 追加/削除ボタン (Kind30030Note.svelte のロジックを再利用) -->
        {#if isInMyList}
          <button onclick={handleClickRemove} disabled={$nowProgress}>
            <Trash2 />{$_("customEmoji.remove")}
          </button>
        {:else}
          <button onclick={handleClickAdd} disabled={$nowProgress}>
            <SmilePlus />{$_("customEmoji.add")}
          </button>
        {/if}
      </div>
    {/snippet}
  </LatestEvent>
{/if}

<!-- ページインジケータ -->
<div class="text-sm text-neutral-400">
  {currentIndex + 1} / {emojiTokens.length}
</div>
```

### 3. i18n キー

**ja.json** (`menu.action` に追加):

```json
"emojiInfo": "絵文字情報"
```

**en.json** (`menu.action` に追加):

```json
"emojiInfo": "Emoji Info"
```

### 4. package.json

```
@konemono/nostr-content-parser: <atag 対応バージョン>
```

## データフロー

```
note.content + note.tags
  │
  ├─ parseContent() → Token[]
  │     └─ getCustomEmojis() → CUSTOM_EMOJI tokens のみ抽出
  │           metadata: { name, url, hasMetadata, atag? }
  │
  ├─ hasMetadata === true のもののみ（タグ解決済み）
  │
  ├─ name ベースで重複除去（同じ shortcode が複数回出現する場合）
  │
  ├─ atag なし → name + url のみ表示
  │
  └─ atag あり ("30030:pubkey:d")
        ├─ parseNaddr(["a", atag]) → naddr
        ├─ LatestEvent → kind 30030 イベント取得
        │     filters: { kinds: [30030], authors: [pubkey], "#d": [identifier] }
        ├─ title / description 表示
        └─ $emojis.event.tags に ["a", atag] があるか
             ├─ あり → [リストから削除] ボタン
             └─ なし → [リストに追加] ボタン
```

## ポイント

1. **parser に `atag` 対応を追加** してから lumi 側の実装を行う
2. **`$modalState`** は既存の `Modal.svelte` が `<modal.component {...modal.props} />` で動的に描画するパターンに倣う
3. **追加/削除ロジック** は `Kind30030Note.svelte` の既存コードを再利用
4. **MediaDisplay.svelte** はレイアウト統一の参考（◀▶ ナビゲーション、カウンター表示等）
5. **ラベル名** は後で i18n に正式に追加（「絵文字情報」は暫定）
6. **重複除去**: content 内に同じ `:shortcode:` が複数回出現する場合、name ベースでユニーク化して表示する
7. **循環ナビゲーション**: ◀▶ ボタンは先頭/末尾で無効化せず、ループ表示（MediaDisplay と同様）
8. **`getCustomEmojis()` を使用**: 手動フィルターではなく parser のヘルパー関数を使用。lumi コードベースでは未使用だったが、この新機能から採用する

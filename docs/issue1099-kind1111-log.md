# Issue #1099 kind:1111 対応 実装ログ

## 概要

NIP-22 に従い kind 1 以外のイベントへのリプライを kind 1111 で投稿できるようにし、
kind 1 を root とする kind 1111 を TL から取得して既存の kind 1 リプライツリーに統合する。

関連イシュー: https://github.com/TsukemonoGit/lumilumi/issues/1099

## 決定事項（人間確認済み）

| 論点 | 決定 |
| :--- | :--- |
| kind 42（パブチャ NIP-28）へのリプライ | **既存方式（kind 42）を維持**。抽象化は kind1 / kind42 / それ以外 の3分岐にする |
| メインTL での kind1111 取得範囲 | **フォロイー作者限定**で取得（既存 TL の authors 制約と整合） |
| ログ場所 | `docs/issue1099-kind1111-log.md` に作業ログを記録 |

## 変更前状態（検証結果）

### 既存テスト
- 命令: `npx vitest run`
- 結果: 成功
- 件数: 7 files / 40 tests passed

### 静的解析（svelte-check）
- 命令: `npm run check`
- 結果: **既存エラー 4 件 + 警告 2 件**（変更対象外のファイル。詳細後述）
- 変更対象ファイルへの影響: なし

#### 既存エラー一覧
| ファイル | 行 | 内容 |
| :--- | :--- | :--- |
| `src/lib/components/MarkdownItem/SimpleMarkdown.svelte` | 77-80 | markdown-it プラグイン引数の型不一致（@types/markdown-it の重複型起因） |
| `src/lib/components/Elements/DropdownMenu.svelte` | 34 | （要確認） |
| `src/lib/components/NostrElements/kindEvents/NoteActionButtuns/CustomReaction.svelte` | 33 | （要確認） |

- 属性: 既存の可能性が高い（今回の変更ファイルとは無関係）
- 対応方針: 今回の作業では手を触れず、別タスクとして報告

## 変更計画

### 対象ファイル

1. `src/lib/func/replyGenerator.ts`（新規）
   - `ReplyGenerator` 抽象レイヤー。`generateReply()` / `generateNip10Reply()` / `generateNip22Reply()`
2. `src/lib/func/replyGenerator.test.ts`（新規）
   - NIP-10 / NIP-22 / トップレベル / 連鎖 / Addressable 併記のユニットテスト
3. `src/lib/components/NostrElements/kindEvents/NoteActionButtuns/NoteActionButtons.svelte`（変更）
   - `onClickReplyIcon()` を `generateReply()` 経由に変更し、kind による分岐を抽象化
   - kind 1 / 42 以外のリプライボタン無効化を解除
4. `src/lib/func/nostr.ts`（変更）
   - `makeMainFilters()` に `{ kinds: [1111], "#K": ["1"], authors: [フォロイー] }` フィルタを追加
5. `src/lib/stores/useAllReactions.ts`（変更）
   - コメント欄取得に `#E` / `#A`（root 参照）フィルタを追加

### 実行予定コマンド
- `npx vitest run`（テスト）
- `npm run check`（静的解析）

### 戻し手順
- `git restore <file>` / `git checkout -- <file>`。ブランチは現状 `main` のまま作業する（必要なら要相談）

## 進捗（随時追記）

### 2026-09-21 実装完了（承認済みプランに従い実施）

#### 実装内容

1. **`src/lib/func/replyGenerator.ts` 新規作成**
   - `generateReply()` が kind で分岐（1→NIP-10 / 42→NIP-28維持 / それ以外→NIP-22）
   - `generateNip10Reply()`: 既存 NoteActionButtons のロジックを移設
   - `generateNip22Reply()`: root=大文字（E/A + K + P）と parent=小文字（e/a + k + p）を生成。
     Addressable/Replaceable イベントにはアドレスタグとイベント ID タグを併記
   - kind 1111 への連鎖は root 系タグ（E/A/I/K/P）を維持し、parent 系だけ更新
   - `I` / `i` タグ（外部識別子）は未実装（現状の用途が nostr イベントのみのため。将来拡張用コメントを記載）

2. **`src/lib/func/replyGenerator.test.ts` 新規作成（7 テスト）**
   - kind1 トップレベル / root 付き kind1 / kind42 / Addressable (30023) / kind1111 連鎖 / 汎用 kind / relayHint 省略

3. **`NoteActionButtons.svelte` 変更**
   - `onClickReplyIcon()` を `generateReply()` 経由に変更（従来の手書きタグ生成を削除）
   - リプライボタンの `disabled` を kind 1/42 限定から変更。
     `nonReplyableKinds = [0, 5]`（kind0=プロフィール, kind5=削除リクエスト）のみ無効化。
     **判断**：kind0 はメタ、kind5 は削除要求でリプライ先として不自然なため除外。
     これ以外のコンテンツ kind はすべて NIP-22（kind1111）でリプライ可能になった。
   - リプライ不可の kind は変更なし（既存の `noReactionKind` 等によりボタン自体が非表示）

4. **`src/lib/func/nostr.ts` の `makeMainFilters()` 変更**
   - `{ kinds: [1111], "#K": ["1"], authors: pubkeys, since }` を mainFilters と olderFilters の両方に追加
   - フォロイー作者限定（決定事項どおり）。root が kind 1 のコメントのみ TL に表示

5. **`src/lib/stores/useAllReactions.ts` 変更**
   - コメント欄のトップレベルコメント取得用に `#A` / `#E` フィルタを追加

#### 検証結果

| 工程 | 命令 | 結果 |
| :--- | :--- | :--- |
| テスト | `npx vitest run` | 成功（8 files / 47 tests passed。新規 7 件含む） |
| 静的解析 | `npm run check` | **既存エラー 4 件のみ**（変更対象ファイルの新規エラーなし） |
| ビルド | `npm run build` | 成功 |
| 起動確認 | `npm run dev` | 正常起動、リレー接続 4/4、コンソールエラーなし（ログイン前画面） |

**既存エラー 4 件（変更対象外）**:
- `src/lib/components/MarkdownItem/SimpleMarkdown.svelte:77-80`（markdown-it プラグインの型不一致 @types 起因）
- `src/lib/components/Elements/DropdownMenu.svelte:34`
- `src/lib/components/NostrElements/kindEvents/NoteActionButtuns/CustomReaction.svelte:33`

#### 残タスク（人間側での実機確認）
- Nostr ログイン状態での kind1111 投稿（記事 30023 等へのコメントボタン）
- TL 上でのフォロイー kind1111 コメント表示
- 詳細ページのコメント欄へのトップレベルコメント表示（#E/#A 取得）
- 必要に応じた設定トグル化（現状はデフォルト ON）
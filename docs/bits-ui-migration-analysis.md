# bits-ui 移行分析（中断）

## ステータス

パフォーマンス問題により移行を中断。
現在: melt-ui
ブランチ: `bits-ui` (未マージ)

## 発生した問題

bits-ui への移行後、TL のスクロールが実用不可能なレベルで重くなった。

- 症状: ノートのボーダーのみ表示、中身の描画が大幅に遅延
- LoadMore: クリック後、数秒間反応なし。待機後にようやく表示
- 表示ノート数: 50 件

## 原因（特定済み）

### 1. 複数コンポーネントでの `forceMount` 属性

```svelte
<DialogPrimitive.Content forceMount>
```

- 50 個の Dialog が全て同時にマウントされる
- `open={false}` でも bits-ui の初期化処理（focus trap、portal、listener 登録）が実行される
- `forceMount` を削除 → 若干改善したが、依然として実用不可

### 2. Component ベースアーキテクチャのオーバーヘッド

- 50 ノート × 複数コンポーネント（Dialog、Popover、Dropdown 等） = 150 ～ 250 個以上の Root コンポーネント
- bits-ui: Component ベース（Radix Primitives 系の設計思想）
  - 各要素が独立した Svelte コンポーネント
  - Root/Trigger/Content の階層構造
  - 全てのインスタンスが初期化処理を実行
- melt-ui: Action ベース（Svelte 固有の最適化）
  - DOM に直接バインディング
  - 必要な時だけ初期化
  - 初期化コストが低い

### 3. Portal の累積

```svelte
<DialogPrimitive.Portal>
```

- 50 個の Portal が `document.body` に生成される
- 各 Portal が独立した state 管理と DOM mutation observer を持つ

### 4. $effect の累積実行

```svelte
$effect(() => {
  const isCurrentDialog = $popStack?.[0]?.id === id;
  if (isCurrentDialog) {
    untrack(() => (open = false));
  }
});
```

- 50 個の Dialog × 複数の $effect = 100 個以上の reactive subscription
- `$popStack` の変化ごとに全 Dialog で再評価される

## 試行した対策

1. `forceMount` の削除: 10 ～ 20%程度の改善
2. 依然として実用的な速度には程遠い

## 判断

**melt-ui を継続使用する。**

### 理由

1. **アーキテクチャの不一致**

   - bits-ui は大量の同時マウントを想定した設計ではない
   - Component ベースの設計が、この用途に不向き

2. **リファクタリングコストが高い**

   - 実用的な速度にするには以下が必要:
     - 全ノートで単一の Dialog インスタンスを共有
     - Popover/Dropdown の遅延初期化
     - Portal 管理の最適化
     - state の集約
   - 既存コードの大幅な書き換えが必要
   - 新たなバグ混入のリスク

3. **改善の確実性が低い**

   - 最適化後も melt-ui より遅い可能性
   - 試行錯誤と計測の繰り返しが必要

4. **melt-ui が既に動作している**
   - ロールバック済みの構成が存在
   - 動作確認済み
   - 追加作業不要

## bits-ui を再検討する場合の条件

以下の**全てを満たす場合のみ**検討する価値がある:

### 必須の変更

1. 全ノートで単一の Dialog インスタンスを共有

   ```svelte
   <!-- Before: 各ノートに Dialog -->
   {#each notes as note}
     <Note {note}>
       <Dialog id={note.id}>...</Dialog>
     </Note>
   {/each}

   <!-- After: 1つの Dialog を共有 -->
   {#each notes as note}
     <Note {note} {openDialog} />
   {/each}

   <Dialog id="shared-dialog" bind:open={dialogOpen}>
     {#if selectedNote}
       <NoteMenu note={selectedNote} />
     {/if}
   </Dialog>
   ```

2. Popover/Dropdown の遅延マウント

   ```svelte
   <script>
     let mounted = $state(false);

     onMount(() => {
       requestIdleCallback(() => {
         mounted = true;
       });
     });
   </script>

   {#if mounted}
     <Popover.Root>...</Popover.Root>
   {/if}
   ```

3. 各段階でパフォーマンス計測

   - Chrome DevTools > Performance
   - Main thread の Long Task 確認
   - melt-ui 構成と比較

4. melt-ui と同等以上の速度が確認できた場合のみ続行

### 再検討を推奨しないケース

- bits-ui 固有の必須機能がない
- パフォーマンス要件が変わらない
- マウント数が劇的に減少しない（10 個以下にならない）

## 技術的詳細

### bits-ui と melt-ui の設計思想の違い

| 項目             | bits-ui                    | melt-ui            |
| ---------------- | -------------------------- | ------------------ |
| 基本設計         | Component ベース           | Action ベース      |
| 初期化タイミング | マウント時                 | 使用時             |
| DOM 構造         | 階層的コンポーネント       | Action による拡張  |
| 適した用途       | 単一・少数のコンポーネント | 大量の同時マウント |
| 参考実装         | Radix Primitives           | Svelte 固有最適化  |

### パフォーマンスボトルネック

1. **初期化コストの累積**

   - 50 ノート × N 個のコンポーネント = 全て同時初期化
   - EventListener 登録の累積
   - ARIA 属性計算の累積
   - Portal 要素生成の累積

2. **メインスレッドのブロッキング**

   - 同期的な初期化処理により描画がブロックされる
   - ボーダーのみ表示、中身が遅延する現象の原因

3. **Reactive subscription の累積**
   - 各コンポーネントが独立した state 管理
   - グローバル state の変更で全コンポーネントが再評価

## 参考情報

- 分析日: 2026-01-10
- ブランチ: `bits-ui`
- 関連ファイル: Dialog.svelte, DropdownMenu.svelte, Popover.svelte
- 表示ノート数: 50 件
- 推定コンポーネント数: 150 ～ 250 個以上
  - 内訳例: 50 ノート × (Dialog 1 個 + Popover 2 個 + DropdownMenu 1 個) = 200 個

## 補足: melt-ui の懸念事項

melt-ui を継続使用する場合、以下を定期的に確認する必要がある:

1. **メンテナンス状況**

   - 最終更新日
   - Issue の対応状況
   - コミュニティの活発さ

2. **Svelte 5 対応状況**
   - 現在の対応レベル
   - 将来的な互換性

確認方法:

```bash
npm info @melt-ui/svelte
```

melt-ui のメンテナンスが停止した場合、以下の選択肢を検討:

1. bits-ui への移行（上記の最適化を実施）
2. 独自実装
3. 他のライブラリ（headless-ui 等）

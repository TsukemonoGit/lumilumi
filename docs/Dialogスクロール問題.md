# Dialogスクロール問題

## 現象

Dialogが開いている状態で ふぁぼ/会話を表示 ボタンをクリックするとページがスクロールトップに戻る。

## 原因

melt-uiの`createDialog`が内部でMutationObserverによるfocus trap監視を常時行っており、「クリックによってフォーカスを持った要素がDOM変化で消える」ときに`tryFocus`が発火。ブラウザがfocus trapによるフォーカス移動先をビューポートに収めようとしてスクロールが発生する。

スタックトレース：

```
tryFocus @ index.js:470
checkDomRemoval2 @ index.js:890
childList
append @ template.js:378
consequent @ Reactioned.svelte:71
```

`button`はクリック時に自動でフォーカスを受け取るため発生する。`button`→`div`の切り替え（loadingパターン）はクリックしていない要素の消滅なので発生しない。`CustomReaction`はクリック後もボタン要素が残るため発生しない。

## 試したこと

### 効果なし

- `preventScroll: false` → melt-uiの`createDialog`に該当オプションの存在を未確認のまま提案（誤り）
- `forceVisible: false` → 挙動変わらず
- `button`→`disabled button`に変更（`div`の代わりに`button`を維持） → 変わらず
- `e.stopPropagation()` / `e.preventDefault()` → 変わらず
- `type="button"`を明示 → 変わらず
- `tabindex="-1"` → 変わらず
- `(e.currentTarget as HTMLButtonElement).blur()` → 変わらず
- `Reactioned`の`loading`/`content`スニペット切り替えをなくす（常に`content`にundefinedを渡す） → 変わらず

### 有効だった回避策

`button`の`onclick`を`div`の`onclick`に変更する。`div`はデフォルトでフォーカスを受け取らないため、DOM変化後もmelt-uiのfocus trapが反応しない。

```svelte
<div
  class="actionButton"
  onclick={handleClickReaction}
>
```

**注意**: `tabindex="0"`を付与すると`div`でもフォーカスを受け取れるようになり、同じ問題が再発する。`role="button"`や`tabindex="0"`は付けない。

## 未解決

根本原因（なぜ`button`のみで発生するか）は完全には特定できていない。`blur()`や`tabindex="-1"`で回避できなかった理由も不明。melt-uiのfocus trap実装の詳細に依存している可能性がある。

アクセシビリティ（スクリーンリーダー等）への対応は未解決のまま。

# TanStack Query → applesauce 移行手順書（Lumilumi）

## 1. 移行の目的と方針

- **目的**: クエリキャッシュ + リアクティブ購読の役割（現在は TanStack Query が担当）を、Nostr 専用のイベントストア **applesauce** の `EventStore` + モデル購読に置き換える。rx-nostr はそのままトランスポート層として残す。
- **方針**:
  - `useXxx` フックと `ReqResult`（`data`/`status`/`error` の Readable）の**シグネチャは変えない**。内部実装だけ applesauce 化 → コンポーネント側の変更を最小化。
  - 全フェーズを「ビルドが通り、実行できる状態」で区切る。TanStack Query を残したまま EventStore を横に置き（サイドバイサイド）、段階的に切り替えて最後に削除する。

## 2. 現状把握（TanStack Query が担っている3パターン）

| パターン | 現行実装 | 主な消費箇所 |
|---|---|---|
| ① 単一/リプレース可能イベント読み取り | `useReq`(backward)+`createQuery`。キー: `["note", id]`, `["naddr","kind:pubkey:d"]`, `["metadata", pubkey]` | `useEvent`/`useMetadata`/`useContacts`/`useReplaceableEvent`/`useLatestEvent` → 数十コンポーネントの葉ノード |
| ② タイムライン（live + ページング） | `useForwardReq`/`useGlobalReq`/`useMainTimelineReq`/`useSearchReq` + `[...key, "olderData"]` キャッシュ + `timelineList.ts` の `firstLoadOlderEvents`/`loadOlderEvents` | `MainTimeline.svelte`/`TimelineList.svelte`/`GlobalTimeline.svelte`/`SearchResultList.svelte`/`NotificationList.svelte` 等 |
| ③ 使い捨てリクエスト / 非Nostrキャッシュ | `usePromiseReq`(21箇所), `usePaginatedReq`, `createQuery`/`fetchQuery`/`getQueryData`/`setQueryData` (ogp, url, geohash, nip05, zap LNURL) | `zap.ts`, `settings.ts`, `mute.ts`, `customEmoji.ts`, `Settings.svelte` 等 |

さらに `queryClient` を直接触る箇所がある: `setQueryData`(operators.ts の `saveEachNote`/`metadata`/`bookmark`, nostr.ts の metadata 永続化), `removeQueries`, `invalidateQueries`, `refetchQueries`, `fetchQuery`, `QueryObserver`。

## 3. ターゲットアーキテクチャ

```
rx-nostr (RxNostr ×2) ──► UpstreamPool アダプタ ──► applesauce loaders / eventLoader
                                                    │  fetch したイベントを add
                                                    ▼
                                EventStore (applesauce-core)  = 唯一のキャッシュ
                                                    │  モデル購読 (event/replaceable/profile/contacts/timeline)
                                                    ▼
                              Svelte ブリッジ (RxJS Observable → Readable/rune)
                                                    │
                                                    ▼
                                   既存コンポーネント (ReqResult は不変)
```

- **EventStore**: `new EventStore({ verifyEvent })` をシングルトンで新設（`$lib/stores/eventStore.ts`）。TanStack の `queryClient` の代わり。
- **イベントローダ**: `createEventLoaderForStore(store, pool, opts)`（`applesauce-loaders`）を `store.eventLoader` に設定。これが `["note", id]` / `["naddr", ...]` の「なかったら取得してくる」処理と、リレーヒント（`NoteByRelayhint`/`NaddrByRelayhint`）の両方を肩代わりする。
- **タイムラインローダ**: `createTimelineLoader(pool, relays, filters, { cache, eventStore })`。window(since/until) 監視で前後ブロックを自動読み込み → `olderData` 手動管理を廃止。
- **UpstreamPool**: `(relays, filters) => Observable<NostrEvent>` 形式。rx-nostr はリクエスト毎に `createRxBackwardReq()` を作る薄いアダプタを自作する（`completeOnTimeout` で完了化）。
- **Svelte ブリッジ**: `fromObservable(obs, initial)` を作り、applesauce の RxJS Observable → Svelte `Readable`/rune に変換。

## 4. 対応表（TanStack Query → applesauce）

| TanStack Query | applesauce 置き換え先 |
|---|---|
| `QueryClient` / `QueryClientProvider` | `EventStore` シングルトン |
| `["note", id]` + `useEvent` | `store.event(id)`（取得は `eventLoader`） |
| `["naddr","kind:pubkey:d"]` + `useReplaceableEvent` | `store.replaceable(kind, pubkey, d)` / `addressable(...)` |
| `["metadata", pubkey]` + `useMetadata` | `store.profile(pubkey)` |
| kind3 `useContacts` | `store.contacts(pubkey)` |
| kind10002（リレー設定） | `store.mailboxes(pubkey)` |
| `useForwardReq`/`useGlobalReq`/`useMainTimelineReq`/`useSearchReq` + `olderData` | `createTimelineLoader` + `loadBackwardBlocks`/`loadForwardBlocks` + `mapEventsToTimeline` |
| `useReq`(backward) / `usePromiseReq`(21箇所) | フィルタ取得 → `eventStore.add` → モデル購読 or Promise で返すユーティリティ |
| `usePaginatedReq` | `loadBackwardBlocks`（until を進めてループ） |
| `saveEachNote`/`metadata`/`bookmark` の `setQueryData` | `eventStore.add(packet.event, packet.from)` |
| `getQueryData(key)` | `eventStore.getEvent(id)` / `getReplaceable(kind,pubkey,d)` |
| `removeQueries` | ローダ停止/購読解除 + `eventStore.remove` |
| `invalidateQueries`/`refetchQueries` | ローダの再実行（`eventLoader` 再コール / timeline window 更新） |
| `QueryObserver`（reaction系, NotificationList 等） | `store.filters(filters)` 等のモデル購読 → Svelte ブリッジ |
| `fetchQuery`/`createQuery`(ogp, url, geohash, nip05, zap LNURL) | 最小の独自 Promise キャッシュ（Map + TTL）へ置換（Nostr イベントでないため EventStore 外） |

## 5. 必要なパッケージ

- 導入済み: `applesauce-core`（EventStore, EventMemory, モデル, observable）
- **追加**: `applesauce-loaders`（イベント/アドレス/タイムラインローダ。UpstreamPool/CacheRequest ベースの現行 6.x API）
- 任意: `applesauce-factory`（イベント作成・公開の整理）, `applesauce-accounts`（アカウント管理）
- 注意: 旧 `applesauce-stores`/`applesauce-pipes` は廃止され loaders に統合済み。実装前に applesauce 公式ドキュメント/サンプルで現行 API を必ず確認する。

## 6. フェーズ別タスクと実施順

### Phase 0: 準備（基盤）
1. applesauce 6.x の現行 API を調査（EventStore モデル、`createEventLoaderForStore`、`createTimelineLoader`、`mapEventsToStore`）。
2. `applesauce-loaders` を追加インストール。
3. `EventStore` シングルトンを新設し、verifier（既存の `@rx-nostr/crypto` worker）を設定。
4. `UpstreamPool` アダプタ（rx-nostr → `(relays, filters)=>Observable<NostrEvent>`）を実装。
5. Svelte ブリッジ `fromObservable` / `toReqResult` ユーティリティを実装（`ReqResult` 型は維持）。
6. **完了条件**: `npm run check` が通り、既存機能が無変更で動く（サイドバイサイド状態）。

### Phase 1: ① 単一/リプレース可能イベント（葉ノード）— 優先度最高
1. `store.eventLoader` に `createEventLoaderForStore` を設定（リレーヒント対応込み）。
2. `useReq`(backward) を内部のみ置換し、`useEvent`/`useReplaceableEvent`/`useMetadata`/`useContacts`/`useLatestEvent` を順にモデル購読ベースへ。
3. `operators.ts` の `saveEachNote`/`metadata`/`bookmark` を `eventStore.add` ベースに変更（`tie` の `seenOn`/`isNew` は残す）。
4. nostr.ts の `metadataQueue` + localStorage 永続化を EventStore の insert 購読 + バッチ書き込み（`persistEventsToCache` 相当）に置換。
5. コンポーネント側の `queryClient.getQueryData`/`setQueryData`/`removeQueries`（note/naddr/metadata 系）を store 読み書きに置換（FollowButton, UserMenu, DeleteNoteDialog, NoteByRelayhint, NaddrByRelayhint など）。
6. **完了条件**: プロフィール/ノート/リスト/ブックマーク表示が TanStack なしで動く。

### Phase 2: ② タイムライン（最複雑）
1. `timelineList.ts` の `firstLoadOlderEvents`/`loadOlderEvents` を `createTimelineLoader`（backward ブロック読み込み）へ置換。
2. `MainTimeline.svelte` / `TimelineList.svelte` / `GlobalTimeline.svelte` の `createQuery` + `olderData` キャッシュを loader の window 管理に置換。無限スクロールは `loadOlder()`（window.until 更新）呼び出しに。
3. リロード時の `since` 復元（従来 `getQueryData([...key,"olderData"])`）を、loader 初期 window に置換。
4. `useSearchReq`（NIP-50 search）は forward ブロック読み込みへ。
5. ミュート/会話フィルター演算子（`timelineFilter`/`muteCheck`/conversation）は EventStore の timeline 出力に対して再適用（表示層フィルターとして実装を検討）。
6. `NotificationList` の `QueryObserver` ベース実装をモデル購読に置換。
7. **完了条件**: ホーム/グローバル/検索/通知/チャンネル/リスト/ピンの各タイムラインが動作。

### Phase 3: ③ 使い捨てリクエスト（`usePromiseReq` 21箇所）
1. `usePromiseReq` を「取得 → `eventStore.add` → 結果返却」のユーティリティへ置換（シグネチャ維持 or 呼び出し側を書き換え、要判断）。
2. 呼び出し箇所を順次移行（`mute.ts`, `customEmoji.ts`, `zap.ts`, `FollowButton`, `UserMuteMenu`, `Settings`, `SetDefaultRelays`, `UploaderSelect`, `profile/relays` ページ等）。
3. `usePaginatedReq`（AllReactions）を backward ブロック読み込みで再実装。
4. **完了条件**: リアクション一覧、ミュート、リレー設定、アップローダ等が動作。

### Phase 4: 非Nostrキャッシュ + QueryObserver の一掃
1. 汎用 Promise キャッシュ（`createAsyncCache(key, fn, {ttl})`）を実装し、`ogp.ts`/`useUrl.ts`/`geohash.ts`/`nip05.ts`/`zap.ts` の `createQuery`/`fetchQuery`/`getQueryData`/`setQueryData` を置換。
2. `QueryObserver`（Reactioned/Zapped/Reposted/ZapInvoiceWindow/about）を `store.filters()` 購読 + Svelte ブリッジへ。`["reactions", id, type, pubkey]` は kind7/6/9735 + tag フィルタで再現。
3. **完了条件**: `@tanstack` への依存がソースコード上ゼロ。

### Phase 5: クリーンアップ
1. `+layout.svelte` から `QueryClientProvider`/devtools を削除。
2. `QueryKey` 型インポートを全ファイルから一掃（`types.ts` の `UseReqOpts`/`ReqResult` 周りも整理）。
3. `package.json` から `@tanstack/svelte-query`/`@tanstack/svelte-query-devtools` を削除。
4. 回帰確認: `npm run check` / `npm test` / 手動（ログイン、TL、検索、通知、ザップ、リレー設定、ブックマーク、プロフィール、リスト、チャンネル、ピン、メディア表示）。

## 7. 決定事項・リスク（実装前に決める）

1. **EventPacket vs NostrEvent**: 現在アプリ全体が rx-nostr の `EventPacket`（`.event`/`.from`/`seenOn`/`isNew`）ベース。applesauce は `NostrEvent` を格納する。型変換関数か、ビュー境界で `{event, from}` を再構成するか、徐々に `NostrEvent` へ寄せるかを決定。
2. **QueryKey の廃止**: 文字列キー（`note`/`naddr`/`metadata`）が消え、EventStore の「イベントID / リプレース可能アドレス」に正規化される。`naddr` と `metadata` 等の重複エイリアスは1実体に集約。
3. **staleTime/gcTime の再現**: 「1時間キャッシュ」「再フェッチ∞」を EventStore の LRU + `claim`/`prune`、および「store に無ければ取得、有れば返す」ローダ挙動で再現。どのデータをリアルタイム更新するかを要件整理。
4. **リレー指定**: applesauce のモデル購読はグローバル（デフォルトリレー）前提。明示リレー（リレーヒント、設定リレーのみ）はローダ側で取得して EventStore に入れる2段構えにする。
5. **リアルタイム購読**: ログイン中に kind0/kind3/kind10003/10003 を TL へ流す現在の forward req + operator を、EventStore モデル購読 + 必要なら forward ブロック読み込みで維持する。
6. **metadata のローカルストレージ永続化**: 既存 `metadataQueue` + `saveMetadataToLocalStorage` の役割を移行後も保つ（EventStore の insert 購読 → バッチ書き込み）。
7. **applesauce API の刷新**: 6.x で大改修されているため、実装前にドキュメント/実例で API を必ず確認する。

## 8. 全体の完了条件

- `src/` から `@tanstack/svelte-query` の import が 0 件、`QueryClient`/`QueryKey`/`QueryObserver` が存在しない。
- ログイン〜TL〜検索〜通知〜ザップ〜リレー設定〜ブックマークの全機能が回帰なしで動作。
- `npm run check` / `npm test` が green。

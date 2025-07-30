<script lang="ts">
  import { page } from "$app/state";
  import EmptyCardList from "$lib/components/NostrElements/kindEvents/EventCard/EmptyCardList.svelte";
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";

  import type { LayoutData } from "../../$types";
  import * as Nostr from "nostr-typedef";

  import CalendarWidget from "./CalendarWidget.svelte";

  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { queryClient } from "$lib/stores/stores";

  import { getNip05FromMetadata } from "$lib/func/nip05";
  import { error } from "@sveltejs/kit";
  import type { EventPacket } from "rx-nostr";
  import UserActivityLoader from "./UserActivityLoader.svelte";

  let { data }: { data: LayoutData } = $props();
  let localDate: Date | null = $derived.by(() => {
    const slug = page.params.slug;
    if (slug) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(slug)) return null;

      const [y, m, d] = slug.split("-").map(Number);
      return new Date(y, m - 1, d); // ローカルの0:00:00
    } else {
      return null;
    }
  });
  const maxHeight = undefined;
  const displayMenu = true;
  const depth = 0;
  const zIndex = undefined;
  const repostable = true;
  const thread = undefined;
  // ページネーション設定
  const ITEMS_PER_PAGE = 20;

  let getLocalDayRange: { since: number; until: number } | null = $derived.by(
    () => {
      if (!localDate) return null;

      const since = Math.floor(localDate.getTime() / 1000);
      const until = since + 86400;

      return { since, until };
    }
  );

  let userRelayList: string[] | undefined = $state(undefined);

  const onChange = (ev: Nostr.Event) => {
    console.log(ev);
    //writeもreadもリレーリストをuserRelayListにいれる。
    userRelayList = (ev.tags as string[][])
      .filter(
        (tag) => tag[0] === "r" && tag.length > 1 //&& relayRegex.test(tag[1])
        //    && relayRegex.test(tag[1]) &&
        //     (tag.length === 2 || tag[2] === "write")
      )
      .map((r) => r[1])
      .slice(0, 20);
  };

  $inspect("userRelayList", userRelayList);

  // 共有機能
  async function handleShare() {
    let shareUrl = window.location.href;

    // URLにnpubまたはnprofileが含まれている場合のみnip05置換を検討
    const npubPattern = /npub\w{59}/;
    const nprofilePattern = /nprofile\w{59,}/;

    if (npubPattern.test(shareUrl) || nprofilePattern.test(shareUrl)) {
      try {
        // メタデータからNIP-05アドレスを取得
        const metadataPk: EventPacket | null | undefined =
          queryClient.getQueryData(["metadata", data.pubkey]);
        if (!metadataPk) throw error;
        const nip05Address = await getNip05FromMetadata(
          metadataPk.event,
          queryClient
        );

        // nip05アドレスが取得できた場合のみ置換
        if (nip05Address) {
          if (npubPattern.test(shareUrl)) {
            shareUrl = shareUrl.replace(npubPattern, nip05Address);
          } else if (nprofilePattern.test(shareUrl)) {
            shareUrl = shareUrl.replace(nprofilePattern, nip05Address);
          }
        }
      } catch (error) {
        console.error("NIP-05 verification failed:", error);
        // エラーが発生した場合は元のURLを使用
      }
    }

    // 共有処理
    try {
      const shareData = {
        text: "",
        url: shareUrl,
      };

      await navigator.share(shareData);
    } catch (error: any) {
      console.error("Share failed:", error.message);
      // フォールバック処理（クリップボードにコピーなど）
      try {
        await navigator.clipboard.writeText(shareUrl);
        console.log("URL copied to clipboard");
      } catch (clipboardError) {
        console.error("Failed to copy to clipboard:", clipboardError);
      }
    }
  }
</script>

{#if !localDate}
  error
{:else}
  <section>
    <!-- サイドバー（プロフィール＆カレンダー） -->
    <div class="grid grid-cols-1 gap-6 w-full">
      <!-- メインコンテンツ -->
      <div>
        <LatestEvent
          queryKey={["relays", data.pubkey]}
          filters={[{ kinds: [10002], authors: [data.pubkey], limit: 1 }]}
          {onChange}
        >
          {#snippet loading()}
            <EmptyCardList length={1} />
          {/snippet}

          {#snippet error()}
            <UserActivityLoader
              pubkey={data.pubkey}
              relays={undefined}
              range={getLocalDayRange}
              {localDate}
              {maxHeight}
              {thread}
              {depth}
              {repostable}
              {zIndex}
              {displayMenu}
              {handleShare}
            />
          {/snippet}

          {#snippet nodata()}
            <UserActivityLoader
              pubkey={data.pubkey}
              relays={undefined}
              range={getLocalDayRange}
              {localDate}
              {maxHeight}
              {thread}
              {depth}
              {repostable}
              {zIndex}
              {displayMenu}
              {handleShare}
            />
          {/snippet}
          <UserActivityLoader
            pubkey={data.pubkey}
            relays={userRelayList}
            range={getLocalDayRange}
            {localDate}
            {maxHeight}
            {thread}
            {depth}
            {repostable}
            {zIndex}
            {displayMenu}
            {handleShare}
          />
        </LatestEvent>
      </div>
    </div>
    <div class="py-4">
      <CalendarWidget currentDate={localDate} />
    </div>
  </section>
{/if}
<!-- デバッグ情報（開発環境のみ） -->
{#if import.meta.env.DEV}
  <div class="mt-8 p-4 bg-neutral-800 rounded">
    <details>
      <summary class="cursor-pointer font-semibold">デバッグ情報</summary>
      <div class="mt-2 space-y-2">
        <div><strong>localDate:</strong> {localDate}</div>
        <div><strong>Range:</strong> {JSON.stringify(getLocalDayRange)}</div>
        <div>
          <strong>User Relay List:</strong>
          {JSON.stringify(userRelayList)}
        </div>
        <div>
          <strong>Data:</strong>
          <pre
            class="text-xs break-all whitespace-pre-wrap max-w-full overflow-hidden">{JSON.stringify(
              data,
              null,
              2
            )}</pre>
        </div>
      </div>
    </details>
  </div>
{/if}
<div class="postWindow">
  <OpenPostWindow
    options={{
      tags: [],
      kind: 1,
    }}
  />
</div>

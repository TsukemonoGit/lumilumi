<script lang="ts">
  import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";
  import UserPopupMenu from "$lib/components/NostrElements/user/UserPopupMenu.svelte";
  import PaginationList from "$lib/components/NostrElements/UserTabs/PaginationList.svelte";
  import { t } from "@konemono/svelte5-i18n";
  import { Share } from "lucide-svelte";
  import RangeEventLoader from "./RangeEventLoader.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import * as Nostr from "nostr-typedef";
  interface Props {
    pubkey: string;
    relays: string[] | undefined;
    range: any; // getLocalDayRangeの型に応じて調整
    localDate: Date;
    maxHeight?: number;
    thread?: boolean;
    depth?: number;
    repostable?: boolean;
    zIndex?: number;
    displayMenu?: boolean;
    handleShare: () => void;
  }
  const {
    pubkey,
    relays,
    range,
    localDate,
    maxHeight,
    thread,
    depth,
    repostable,
    zIndex,
    displayMenu = true,

    handleShare,
  }: Props = $props();

  // イベントの統計を計算
  const getEventStats = (events: Nostr.Event[]) => {
    const posts = events.filter((event) => event.kind === 1);
    const reposts = events.filter(
      (event) => event.kind === 6 || event.kind === 16
    );

    return {
      posts: posts.length,
      reposts: reposts.length,
      total: events.length,
    };
  };

  export function formatDateOnly(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }
</script>

{#if range}
  <RangeEventLoader
    {relays}
    {range}
    filter={{ kinds: [1, 6, 16], authors: [pubkey] }}
  >
    {#snippet children(events)}
      {#if events.length > 0}
        <!-- 統計情報 -->
        {@const stats = getEventStats(events)}
        <div class="bg-neutral-900 p-4 rounded-lg mb-2">
          <!-- ヘッダー部分 -->
          <div class="flex justify-between items-start mb-3">
            <h3 class="text-lg font-semibold">
              <div class="inline-flex align-bottom">
                <Metadata queryKey={["metadata", pubkey]} {pubkey}>
                  {#snippet loading()}
                    <UserPopupMenu
                      {pubkey}
                      metadata={undefined}
                      size={24}
                      depth={0}
                    />
                  {/snippet}

                  {#snippet error()}
                    <UserPopupMenu
                      {pubkey}
                      metadata={undefined}
                      size={24}
                      depth={0}
                    />
                  {/snippet}

                  {#snippet nodata()}
                    <UserPopupMenu
                      {pubkey}
                      metadata={undefined}
                      size={24}
                      depth={0}
                    />
                  {/snippet}

                  {#snippet content({ metadata })}
                    <UserPopupMenu {pubkey} {metadata} size={24} depth={0} />
                  {/snippet}
                </Metadata>
              </div>
              {$t("date.activity_on", {
                date: formatDateOnly(localDate),
              })}
            </h3>

            <!-- 共有ボタン - 右上 -->
            <button
              class="flex items-center gap-1 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs rounded transition-colors duration-200 shrink-0"
              onclick={handleShare}
            >
              <Share class="w-4 h-4" />
              <span>{$t("menu.sharelink")}</span>
            </button>
          </div>
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-blue-600">
                {stats.posts}
              </div>
              <div class="text-sm text-neutral-400">
                {$t("date.post")}
              </div>
            </div>
            <div>
              <div class="text-2xl font-bold text-green-600">
                {stats.reposts}
              </div>
              <div class="text-sm text-neutral-400">
                {$t("date.repost")}
              </div>
            </div>
            <div>
              <div class="text-2xl font-bold text-purple-600">
                {stats.total}
              </div>
              <div class="text-sm text-neutral-400">
                {$t("date.total")}
              </div>
            </div>
          </div>
        </div>
        <PaginationList list={events}>
          {#snippet children(event, index)}
            {#if event}
              {@const note = event as Nostr.Event}
              <Metadata
                queryKey={["metadata", note.pubkey]}
                pubkey={note.pubkey}
              >
                {#snippet loading()}
                  <EventCard
                    {note}
                    {maxHeight}
                    {thread}
                    {depth}
                    {repostable}
                    {zIndex}
                  />
                {/snippet}
                {#snippet nodata()}
                  <EventCard
                    {note}
                    {maxHeight}
                    {thread}
                    {depth}
                    {repostable}
                    {zIndex}
                  />
                {/snippet}
                {#snippet error()}
                  <EventCard
                    {note}
                    {maxHeight}
                    {thread}
                    {depth}
                    {repostable}
                    {zIndex}
                  />
                {/snippet}
                {#snippet content({ metadata })}
                  <EventCard
                    {note}
                    {metadata}
                    {maxHeight}
                    {thread}
                    {displayMenu}
                    {depth}
                    {repostable}
                    {zIndex}
                  />
                {/snippet}
              </Metadata>{/if}
          {/snippet}
        </PaginationList>
      {:else}
        <div class="text-center py-12">
          <div class="text-gray-500 text-lg">
            {$t("date.no_posts_today")}
          </div>
        </div>
      {/if}
    {/snippet}
  </RangeEventLoader>
{/if}

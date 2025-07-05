<script lang="ts">
  import { page } from "$app/state";
  import EmptyCardList from "$lib/components/NostrElements/kindEvents/EventCard/EmptyCardList.svelte";
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";

  import type { LayoutData } from "../../$types";
  import * as Nostr from "nostr-typedef";
  import RangeEventLoader from "./RangeEventLoader.svelte";

  import CalendarWidget from "./CalendarWidget.svelte";
  import PaginationList from "$lib/components/NostrElements/UserTabs/PaginationList.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import UserPopupMenu from "$lib/components/NostrElements/user/UserPopupMenu.svelte";
  import { t } from "@konemono/svelte5-i18n";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { toastSettings } from "$lib/stores/stores";
  import { Share } from "lucide-svelte";
  import { relayRegex } from "$lib/func/regex";

  let { data }: { data: LayoutData } = $props();
  let localDate: Date | null = $derived.by(() => {
    const slug = page.params.slug;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(slug)) return null;

    const [y, m, d] = slug.split("-").map(Number);
    return new Date(y, m - 1, d); // ローカルの0:00:00
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
        (tag) => tag[0] === "r" && relayRegex.test(tag[1])
        //    && relayRegex.test(tag[1]) &&
        //     (tag.length === 2 || tag[2] === "write")
      )
      .map((r) => r[1])
      .slice(0, 20);
  };

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

  $inspect("userRelayList", userRelayList);
  export function formatDateOnly(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }

  // 共有機能
  async function handleShare() {
    const shareData = {
      title: "",
      url: window.location.href,
    };

    try {
      await navigator.share(shareData);
    } catch (error: any) {
      console.error(error.message);
      $toastSettings = {
        title: "Error",
        description: "Failed to share",
        color: "bg-orange-500",
      };
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
            <EmptyCardList length={10} />
          {/snippet}

          {#snippet error()}
            <div
              class="p-4 bg-red-100 border border-red-400 text-red-700 rounded"
            >
              <p>
                {$t("date.relay_fetch_failed", {
                  error: error?.toString() || "",
                })}
              </p>
            </div>
          {/snippet}

          {#snippet nodata()}
            <div
              class="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded"
            >
              <p>{$t("date.relay_not_found")}</p>
            </div>
          {/snippet}

          {#if getLocalDayRange}
            <RangeEventLoader
              relays={userRelayList}
              range={getLocalDayRange}
              filter={{ kinds: [1, 6, 16], authors: [data.pubkey] }}
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
                          <Metadata
                            queryKey={["metadata", data.pubkey]}
                            pubkey={data.pubkey}
                          >
                            {#snippet loading()}
                              <UserPopupMenu
                                pubkey={data.pubkey}
                                metadata={undefined}
                                size={24}
                                depth={0}
                              />
                            {/snippet}

                            {#snippet error()}
                              <UserPopupMenu
                                pubkey={data.pubkey}
                                metadata={undefined}
                                size={24}
                                depth={0}
                              />
                            {/snippet}

                            {#snippet nodata()}
                              <UserPopupMenu
                                pubkey={data.pubkey}
                                metadata={undefined}
                                size={24}
                                depth={0}
                              />
                            {/snippet}

                            {#snippet content({ metadata })}
                              <UserPopupMenu
                                pubkey={data.pubkey}
                                {metadata}
                                size={24}
                                depth={0}
                              />
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

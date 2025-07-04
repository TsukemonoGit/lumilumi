<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import Reaction from "../kindEvents/Reaction.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import UserPopupMenu from "../user/UserPopupMenu.svelte";

  interface Props {
    events: Nostr.Event[];
  }

  let { events }: Props = $props();

  // undefined や null を除外した配列を作成
  let validEvents = $derived(
    events.filter((event) => event !== undefined && event !== null)
  );

  // content の一致でフィルタリングする関数
  const filterEventsByContent = (events: Nostr.Event[], content: string) => {
    return events.filter((event) => (event.content || "+") === content);
  };

  // ユニークな内容を取得する部分
  let uniqueContents = $derived(
    [...new Set(validEvents.map((event) => event.content || "+"))].sort()
  ); // Get unique contents and sort them

  // content に一致するイベントを見つける関数
  const findEvent = (content: string): Nostr.Event => {
    return validEvents.find(
      (event) => (event.content || "+") === content
    ) as Nostr.Event;
  };
</script>

{#each uniqueContents as content}
  <div class="flex max-w-full p-0.5 overflow-hidden">
    <div class="min-w-6 flex justify-center">
      <Reaction event={findEvent(content)} />
    </div>
    <div class="flex-wrap px-2 gap-1 h-fit">
      {#each filterEventsByContent(validEvents, content) as event (event.id)}
        <!-- 修正: validEvents を使用 -->
        {#if event.pubkey}
          <Metadata queryKey={["metadata", event.pubkey]} pubkey={event.pubkey}>
            {#snippet loading()}
              <UserPopupMenu
                pubkey={event.pubkey}
                metadata={undefined}
                size={24}
                depth={0}
              />
            {/snippet}

            {#snippet error()}
              <UserPopupMenu
                pubkey={event.pubkey}
                metadata={undefined}
                size={24}
                depth={0}
              />
            {/snippet}

            {#snippet nodata()}
              <UserPopupMenu
                pubkey={event.pubkey}
                metadata={undefined}
                size={24}
                depth={0}
              />
            {/snippet}

            {#snippet content({ metadata })}
              <UserPopupMenu
                pubkey={event.pubkey}
                {metadata}
                size={24}
                depth={0}
              />
            {/snippet}
          </Metadata>
        {/if}
      {/each}
    </div>
  </div>
{/each}

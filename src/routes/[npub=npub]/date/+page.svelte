<script lang="ts">
  import UserPopupMenu from "$lib/components/NostrElements/user/UserPopupMenu.svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import type { LayoutData } from "../$types";
  import CalendarWidget from "./[slug=date]/CalendarWidget.svelte";
  // 今日のローカル日付の 0:00:00

  const { data }: { data: LayoutData } = $props();

  const now = new Date();
  const localDate: Date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
</script>

<div class="date-selection-container">
  <div class="header">
    <Metadata queryKey={["metadata", data.pubkey]} pubkey={data.pubkey}>
      {#snippet loading()}
        <UserPopupMenu
          pubkey={data.pubkey}
          metadata={undefined}
          size={46}
          depth={0}
        />
      {/snippet}

      {#snippet error()}
        <UserPopupMenu
          pubkey={data.pubkey}
          metadata={undefined}
          size={46}
          depth={0}
        />
      {/snippet}

      {#snippet nodata()}
        <UserPopupMenu
          pubkey={data.pubkey}
          metadata={undefined}
          size={46}
          depth={0}
        />
      {/snippet}

      {#snippet content({ metadata })}
        <UserPopupMenu pubkey={data.pubkey} {metadata} size={46} depth={0} />
      {/snippet}
    </Metadata>
    <h2 class="text-xl font-semibold mb-2">投稿を閲覧する日付を選択</h2>
    <p class="subtitle">カレンダーから日付を選択してください</p>
  </div>
  <CalendarWidget currentDate={localDate} />
</div>
<div class="postWindow">
  <OpenPostWindow
    options={{
      tags: [],
      kind: 1,
    }}
  />
</div>

<style>
  .date-selection-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
  }
  .header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .subtitle {
    color: #666;
    font-size: 0.9rem;
  }
</style>

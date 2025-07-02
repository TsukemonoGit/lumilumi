<script lang="ts">
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import * as Nostr from "nostr-typedef";
  import UserPopupMenu from "../user/UserPopupMenu.svelte";
  import { Repeat2 } from "lucide-svelte";

  interface Props {
    events: Nostr.Event[];
  }

  let { events }: Props = $props();
</script>

<div class="flex gap-1 m-1">
  <Repeat2 size="20" class="text-magnum-500/75  min-w-5 m-0.5" />
  <div class="flex flex-wrap">
    {#each events as event (event.id)}
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
          <UserPopupMenu pubkey={event.pubkey} {metadata} size={24} depth={0} />
        {/snippet}
      </Metadata>
    {/each}
  </div>
</div>

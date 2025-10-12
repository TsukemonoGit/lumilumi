<script lang="ts">
  import Text from "$lib/components/renderSnippets/nostr/Text.svelte";
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import * as Nostr from "nostr-typedef";
  import { getRelayById } from "$lib/func/nostr";

  interface Props {
    id: string; //kind40 channel id
    heyaRelay?: string;
    channelMetadata: (event: Nostr.Event | null) => any;
  }

  let { id, heyaRelay = $bindable(), channelMetadata }: Props = $props();

  const onChange = (event: Nostr.Event) => {
    heyaRelay = getRelayById(id);
  };
</script>

<Text queryKey={["timeline", id]} {id} {onChange}>
  {#snippet content({ data: kind40Event })}
    <LatestEvent
      queryKey={["channel", "kind41", id]}
      filters={[
        { kinds: [41], authors: [kind40Event.pubkey], limit: 1, "#e": [id] },
      ]}
    >
      {#snippet success({ event: kind41Event })}
        {@render channelMetadata?.(kind41Event)}
      {/snippet}
      {#snippet loading()}
        {@render channelMetadata?.(null)}
      {/snippet}
      {#snippet nodata()}
        {@render channelMetadata?.(kind40Event)}
      {/snippet}
      {#snippet error()}
        {@render channelMetadata?.(null)}
      {/snippet}
    </LatestEvent>
  {/snippet}
</Text>

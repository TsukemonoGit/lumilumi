<script lang="ts">
  import { goto } from "$app/navigation";
  import { getRelaysById } from "$lib/func/nostr";
  import type { ChannelData } from "$lib/types";
  import { MessagesSquare } from "lucide-svelte";
  import { nip19 } from "nostr-tools";
  import * as Nostr from "nostr-typedef";
  import Text from "$lib/components/NostrMainData/Text.svelte";

  export let heyaId: string | undefined;
  export let tieKey: string | undefined;

  const size = 18;
  const getContent = (text: Nostr.Event): ChannelData | undefined => {
    try {
      return JSON.parse(text.content) as ChannelData;
    } catch (error) {
      return undefined;
    }
  };

  const handleClickToChannel = () => {
    if (!heyaId) {
      return;
    }
    const neventPointer: nip19.EventPointer = {
      id: heyaId,
      relays: tieKey ? getRelaysById(heyaId, tieKey) : [],
    };
    goto(`/channel/${nip19.neventEncode(neventPointer)}`);
  };
  $: channelLink = getChannelLink(heyaId);

  function getChannelLink(heyaId: string | undefined): string {
    if (!heyaId) return "";
    try {
      return `/channel/${nip19.noteEncode(heyaId)}`;
    } catch (error) {
      return "";
    }
  }
</script>

{#if heyaId}
  <Text queryKey={["timeline", heyaId]} id={heyaId} let:text>
    <button
      title={channelLink}
      on:click={handleClickToChannel}
      slot="loading"
      class="flex ml-auto hover:opacity-75 focus:opacity-50 text-magnum-300 text-sm"
      ><MessagesSquare {size} class="mr-1" />kind:42</button
    >
    <button
      title={channelLink}
      on:click={handleClickToChannel}
      slot="nodata"
      class="flex ml-auto hover:opacity-75 focus:opacity-50 text-magnum-300 text-sm"
      ><MessagesSquare {size} class="mr-1" />kind:42</button
    >
    <button
      title={channelLink}
      on:click={handleClickToChannel}
      slot="error"
      class="flex ml-auto hover:opacity-75 focus:opacity-50 text-magnum-300 text-sm"
      ><MessagesSquare {size} class="mr-1" />kind:42</button
    >
    {@const channelData = getContent(text)}
    {#if channelData}
      <button
        title={channelLink}
        on:click={handleClickToChannel}
        class="flex ml-auto hover:opacity-75 focus:opacity-50 text-magnum-300 text-sm"
      >
        <MessagesSquare {size} class="mr-1" />{channelData.name}
      </button>
    {:else}
      <button
        title={channelLink}
        on:click={handleClickToChannel}
        class="flex ml-auto hover:opacity-75 focus:opacity-50 text-magnum-300 text-sm"
      >
        <MessagesSquare {size} class="mr-1" />kind:42
      </button>
    {/if}
  </Text>
{/if}

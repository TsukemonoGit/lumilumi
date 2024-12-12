<script lang="ts">
  import { goto } from "$app/navigation";
  import { getRelaysById } from "$lib/func/nostr";
  import type { ChannelData } from "$lib/types";
  import { MessagesSquare } from "lucide-svelte";
  import { nip19 } from "nostr-tools";
  import * as Nostr from "nostr-typedef";
  import Text from "$lib/components/renderSnippets/nostr/Text.svelte";

  interface Props {
    heyaId: string | undefined;
    tieKey: string | undefined;
  }

  let { heyaId, tieKey }: Props = $props();

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

  function getChannelLink(heyaId: string | undefined): string {
    if (!heyaId) return "";
    try {
      return `/channel/${nip19.noteEncode(heyaId)}`;
    } catch (error) {
      return "";
    }
  }
  let channelLink = $derived(getChannelLink(heyaId));
</script>

{#if heyaId}
  <Text queryKey={["timeline", heyaId]} id={heyaId}>
    {#snippet loading()}
      <button
        title={channelLink}
        onclick={handleClickToChannel}
        class="flex ml-auto hover:opacity-75 focus:opacity-50 text-magnum-300 text-sm"
        ><MessagesSquare {size} class="mr-1" />kind:42</button
      >
    {/snippet}
    {#snippet nodata()}
      <button
        title={channelLink}
        onclick={handleClickToChannel}
        class="flex ml-auto hover:opacity-75 focus:opacity-50 text-magnum-300 text-sm"
        ><MessagesSquare {size} class="mr-1" />kind:42</button
      >
    {/snippet}
    {#snippet error()}
      <button
        title={channelLink}
        onclick={handleClickToChannel}
        class="flex ml-auto hover:opacity-75 focus:opacity-50 text-magnum-300 text-sm"
        ><MessagesSquare {size} class="mr-1" />kind:42</button
      >
    {/snippet}
    {#snippet content({ data: text })}
      {@const channelData = getContent(text)}
      {#if channelData}
        <button
          title={channelLink}
          onclick={handleClickToChannel}
          class="flex ml-auto hover:opacity-75 focus:opacity-50 text-magnum-300 text-sm"
        >
          <MessagesSquare {size} class="mr-1" />{channelData.name}
        </button>
      {:else}
        <button
          title={channelLink}
          onclick={handleClickToChannel}
          class="flex ml-auto hover:opacity-75 focus:opacity-50 text-magnum-300 text-sm"
        >
          <MessagesSquare {size} class="mr-1" />kind:42
        </button>
      {/if}
    {/snippet}
  </Text>
{/if}

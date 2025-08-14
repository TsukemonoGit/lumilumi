<script lang="ts">
  import { goto } from "$app/navigation";
  import { getRelaysById } from "$lib/func/nostr";
  import type { ChannelData } from "$lib/types";
  import { MessagesSquare } from "lucide-svelte";
  import * as nip19 from "nostr-tools/nip19";
  import * as Nostr from "nostr-typedef";
  import Text from "$lib/components/renderSnippets/nostr/Text.svelte";

  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { writable } from "svelte/store";
  import EditChannelList from "../../../../routes/channel/EditChannelList.svelte";

  interface Props {
    heyaId: string | undefined;
  }

  let { heyaId }: Props = $props();

  const size = 18;
  const getContent = (text: Nostr.Event): ChannelData | undefined => {
    try {
      return JSON.parse(text.content) as ChannelData;
    } catch (error) {
      console.log(error);
      return undefined;
    }
  };

  const handleClickToChannel = () => {
    if (!heyaId) {
      return;
    }
    const neventPointer: nip19.EventPointer = {
      id: heyaId,
      relays: getRelaysById(heyaId),
    };
    goto(`/channel/${nip19.neventEncode(neventPointer)}`);
  };

  function getChannelLink(heyaId: string | undefined): string {
    if (!heyaId) return "";
    try {
      return `/channel/${nip19.noteEncode(heyaId)}`;
    } catch (error) {
      console.log(error);
      return "";
    }
  }
  let channelLink = $derived(getChannelLink(heyaId));
  const menuTexts: { icon: any; text: string; num: number }[] = [
    { icon: undefined, text: `${$_("channel.menu.edit")}`, num: 0 },
    { icon: undefined, text: `${$_("channel.menu.open")}`, num: 1 },
  ];
  let editChannelListOpen = $state(writable(false));
  const handleSelectItem = (index: number) => {
    console.log(index);
    switch (menuTexts[index].num) {
      case 0:
        //edit
        $editChannelListOpen = true;
        break;
      case 1:
        //open
        goto(channelLink);
        break;
      default:
        break;
    }
  };
</script>

{#if heyaId}
  <DropdownMenu
    {menuTexts}
    {handleSelectItem}
    buttonClass="flex ml-auto hover:opacity-75 focus:opacity-50 text-magnum-300 text-sm"
  >
    <Text queryKey={["note", heyaId]} id={heyaId}>
      {#snippet loading()}
        <MessagesSquare {size} class="mr-1" />kind:42
      {/snippet}
      {#snippet nodata()}
        <MessagesSquare {size} class="mr-1" />kind:42
      {/snippet}
      {#snippet error()}
        <MessagesSquare {size} class="mr-1" />kind:42
      {/snippet}
      {#snippet content({ data: text })}
        {@const channelData = getContent(text)}
        {#if channelData}
          <MessagesSquare {size} class="mr-1" />{channelData.name}
        {:else}
          <MessagesSquare {size} class="mr-1" />kind:42
        {/if}
      {/snippet}
    </Text>
  </DropdownMenu>

  <EditChannelList bind:editChannelListOpen {heyaId} />
{/if}

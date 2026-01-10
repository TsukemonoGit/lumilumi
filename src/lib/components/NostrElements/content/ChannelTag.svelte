<script lang="ts">
  import { goto } from "$app/navigation";
  import type { ChannelData, MenuGroup } from "$lib/types";
  import { MessagesSquare } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";

  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";

  import EditChannelList from "../../../../routes/channel/EditChannelList.svelte";
  import { getChannelLink } from "$lib/func/channel";
  import ChannelMetadata from "../kindEvents/ChannelMetadata.svelte";

  interface Props {
    heyaId: string | undefined;
  }

  let { heyaId }: Props = $props();

  const size = 18;
  const getContent = (text: Nostr.Event): ChannelData | undefined => {
    try {
      return JSON.parse(text.content) as ChannelData;
    } catch (error) {
      return undefined;
    }
  };

  let channelLink = $derived(getChannelLink(heyaId));
  const menuGroups: MenuGroup[] = [
    {
      // label は不要なので省略
      items: [
        { icon: undefined, text: `${$_("channel.menu.edit")}`, action: "edit" },
        { icon: undefined, text: `${$_("channel.menu.open")}`, action: "open" },
      ],
    },
  ];

  let editChannelListOpen = $state(false);
  const handleSelectItem = async (action: string) => {
    switch (action) {
      case "edit":
        //edit
        editChannelListOpen = true;
        break;
      case "open":
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
    {handleSelectItem}
    {menuGroups}
    buttonClass="flex ml-auto hover:opacity-75 focus:opacity-50 text-magnum-300 text-sm"
  >
    <ChannelMetadata id={heyaId}>
      {#snippet channelMetadata(event)}
        {#if event}
          {@const channelData = getContent(event)}
          {#if channelData}
            <MessagesSquare {size} class="mr-1" />{channelData.name}
          {:else}
            <MessagesSquare {size} class="mr-1" />kind:42
          {/if}
        {:else}
          <MessagesSquare {size} class="mr-1" />kind:42
        {/if}
      {/snippet}
    </ChannelMetadata>
  </DropdownMenu>

  <EditChannelList bind:editChannelListOpen {heyaId} />
{/if}

<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import type { ChannelData } from "$lib/types";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";

  import Avatar from "svelte-boring-avatars";

  import { splitHexColorString } from "$lib/func/util";

  import ChannelEllipsisMenu from "./ChannelEllipsisMenu.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserAvatar from "../user/UserAvatar.svelte";
  import UserPopupMenu from "../user/UserPopupMenu.svelte";
  import ListCardComponent from "./layout/ListCardComponent.svelte";

  interface Props {
    id: string; //40
    handleClickToChannel?: (() => void) | undefined;
    linkButtonTitle: string;
    event: Nostr.Event; //40か41

    clickAction: boolean;
    mini?: boolean;
  }

  let {
    id,
    handleClickToChannel = undefined,
    linkButtonTitle,
    event,
    mini,

    clickAction,
  }: Props = $props();
  let size = clickAction ? 96 : 66;
  const getContent = (text: Nostr.Event): ChannelData | undefined => {
    try {
      const kategories = text.tags.reduce((result, tag) => {
        if (tag[0] === "t" && tag.length > 1) {
          result.push(tag[1]);
        }
        return result;
      }, []);
      return {
        ...JSON.parse(text.content),
        kategories: kategories,
      } as ChannelData;
    } catch (error) {
      return undefined;
    }
  };
  const channelData = getContent(event);
</script>

{#if channelData}
  <ListCardComponent
    {mini}
    {clickAction}
    {linkButtonTitle}
    {handleClickToChannel}
    listProps={{
      kind: event.kind,
      name: channelData.name,
      about: channelData.about || "",
      kategories: channelData.kategories || [],
    }}
  >
    {#snippet listAvatar()}
      {#if lumiSetting.get().showImg && channelData.picture}
        <UserAvatar
          url={channelData.picture}
          name={id}
          pubkey={id}
          {size}
          square={true}
        />
      {:else}
        <Avatar
          {size}
          name={id}
          variant="beam"
          colors={splitHexColorString(id)}
          square={true}
        />
      {/if}{/snippet}
    {#snippet userAvatar()}<Metadata
        queryKey={["metadata", event.pubkey]}
        pubkey={event.pubkey}
      >
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
          <UserPopupMenu pubkey={event.pubkey} {metadata} size={40} depth={0} />
        {/snippet}
      </Metadata>{/snippet}
    {#snippet menu()}
      <ChannelEllipsisMenu note={event} {channelData} heyaId={id} />{/snippet}
  </ListCardComponent>
{/if}

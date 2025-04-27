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
    tieKey: string | undefined;
    clickAction: boolean;
  }

  let {
    id,
    handleClickToChannel = undefined,
    linkButtonTitle,
    event,
    tieKey,
    clickAction,
  }: Props = $props();
  let size = clickAction ? 96 : 66;
  const getContent = (text: Nostr.Event): ChannelData | undefined => {
    try {
      return JSON.parse(text.content) as ChannelData;
    } catch (error) {
      return undefined;
    }
  };
  const channelData = getContent(event);
</script>

{#if channelData}
  <ListCardComponent
    {clickAction}
    {linkButtonTitle}
    {handleClickToChannel}
    listProps={{
      kind: event.kind,
      name: channelData.name,
      about: channelData.about || "",
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
            {tieKey}
          />
        {/snippet}

        {#snippet error()}
          <UserPopupMenu
            pubkey={event.pubkey}
            metadata={undefined}
            size={24}
            depth={0}
            {tieKey}
          />
        {/snippet}

        {#snippet nodata()}
          <UserPopupMenu
            pubkey={event.pubkey}
            metadata={undefined}
            size={24}
            depth={0}
            {tieKey}
          />
        {/snippet}

        {#snippet content({ metadata })}
          <UserPopupMenu
            pubkey={event.pubkey}
            {metadata}
            size={40}
            depth={0}
            {tieKey}
          />
        {/snippet}
      </Metadata>{/snippet}
    {#snippet menu()}
      <button class="text-magnum-400"
        ><ChannelEllipsisMenu
          note={event}
          {channelData}
          {tieKey}
          heyaId={id}
        /></button
      >{/snippet}
  </ListCardComponent>
{/if}

<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import type { ChannelData } from "$lib/types";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";

  import Avatar from "svelte-boring-avatars";
  import UserAvatar from "$lib/components/Elements/UserAvatar.svelte";
  import { splitHexColorString } from "$lib/func/util";
  import UserMenu from "$lib/components/Elements/UserPopupMenu.svelte";
  import ChannelEllipsisMenu from "./ChannelEllipsisMenu.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  let size = 96;
  interface Props {
    id: string; //40
    handleClickToChannel?: (() => void) | undefined;
    linkButtonTitle: string;
    event: Nostr.Event; //40か41
    tieKey: string | undefined;
  }

  let {
    id,
    handleClickToChannel = undefined,
    linkButtonTitle,
    event,
    tieKey,
  }: Props = $props();

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
  <div class="w-full grid grid-cols-[1fr_auto]">
    <button
      title={linkButtonTitle}
      class="grid grid-cols-[auto_1fr] hover:opacity-75 active:opacity-50"
      onclick={handleClickToChannel}
    >
      <!--がぞう-->

      <div class="relative">
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
        {/if}
        <div
          class="absolute text-xs bottom-0 left-1 align-bottom text-magnum-900 dark:text-magnum-100 font-semibold bg-black/40 px-0.5"
        >
          kind:{event.kind}
        </div>
      </div>
      <!--てきすとたち-->
      <div class="ml-2 text-start flex flex-col">
        <div class="text-xl font-bold text-magnum-400">
          {channelData.name}
        </div>

        <div class="text-magnum-100">{channelData.about}</div>
      </div></button
    >
    <Metadata queryKey={["metadata", event.pubkey]} pubkey={event.pubkey}>
      {#snippet loading()}
        <UserMenu
          pubkey={event.pubkey}
          metadata={undefined}
          size={24}
          depth={0}
          {tieKey}
        />
      {/snippet}

      {#snippet error()}
        <UserMenu
          pubkey={event.pubkey}
          metadata={undefined}
          size={24}
          depth={0}
          {tieKey}
        />
      {/snippet}

      {#snippet nodata()}
        <UserMenu
          pubkey={event.pubkey}
          metadata={undefined}
          size={24}
          depth={0}
          {tieKey}
        />
      {/snippet}

      {#snippet content({ metadata })}
        <div class="flex flex-col justify-between items-center">
          <UserMenu
            pubkey={event.pubkey}
            {metadata}
            size={40}
            depth={0}
            {tieKey}
          />
          <button class="text-magnum-400"
            ><ChannelEllipsisMenu note={event} {channelData} {tieKey} /></button
          >
        </div>
      {/snippet}
    </Metadata>
  </div>
{/if}

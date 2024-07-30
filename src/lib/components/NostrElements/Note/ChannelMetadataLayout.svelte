<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import type { ChannelData } from "$lib/types";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import { showImg } from "$lib/stores/stores";
  import Avatar from "svelte-boring-avatars";
  import UserAvatar from "$lib/components/Elements/UserAvatar.svelte";
  import { splitHexColorString } from "$lib/func/util";
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  import ChannelEllipsisMenu from "./ChannelEllipsisMenu.svelte";
  export let id: string; //40
  export let handleClickToChannel: (() => void) | undefined = undefined;
  export let linkButtonTitle: string;
  let size = 96;
  export let event: Nostr.Event; //40か41
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
  <div class="grid grid-cols-[1fr_auto]">
    <button
      title={linkButtonTitle}
      class="grid grid-cols-[auto_1fr] hover:opacity-75 active:opacity-50"
      on:click={handleClickToChannel}
    >
      <!--がぞう-->

      <div class="relative">
        {#if $showImg && channelData.picture}
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
    <Metadata
      queryKey={["metadata", event.pubkey]}
      pubkey={event.pubkey}
      let:metadata
    >
      <UserMenu
        slot="loading"
        pubkey={event.pubkey}
        metadata={undefined}
        size={24}
        depth={0}
      />

      <UserMenu
        slot="error"
        pubkey={event.pubkey}
        metadata={undefined}
        size={24}
        depth={0}
      />

      <UserMenu
        slot="nodata"
        pubkey={event.pubkey}
        metadata={undefined}
        size={24}
        depth={0}
      />

      <div class="flex flex-col justify-between items-center">
        <UserMenu pubkey={event.pubkey} {metadata} size={40} depth={0} />
        <button class="text-magnum-400"
          ><ChannelEllipsisMenu note={event} {channelData} /></button
        >
      </div>
    </Metadata>
  </div>
{/if}

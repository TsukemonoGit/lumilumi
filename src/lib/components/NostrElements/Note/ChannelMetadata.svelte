<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import Text from "$lib/components/NostrMainData/Text.svelte";
  import type { ChannelData } from "$lib/types";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import { showImg } from "$lib/stores/stores";
  import Avatar from "svelte-boring-avatars";
  import UserAvatar from "$lib/components/Elements/UserAvatar.svelte";
  import { splitHexColorString } from "$lib/func/util";
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  export let id: string; //kind40 channel id
  let size = 96;
  const getContent = (text: Nostr.Event): ChannelData | undefined => {
    try {
      return JSON.parse(text.content) as ChannelData;
    } catch (error) {
      return undefined;
    }
  };
</script>

<Text queryKey={["timeline", id]} {id} let:text>
  <div slot="loading"></div>
  <div slot="error"></div>
  <div slot="nodata"></div>
  {#await getContent(text) then channelData}
    {#if channelData}
      <div class="grid grid-cols-[auto_1fr_auto]">
        <!--がぞう-->
        <div>
          {#if $showImg && channelData.picture}
            <UserAvatar
              url={channelData.picture}
              name={channelData.name ?? ""}
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
        </div>
        <!--てきすとたち-->
        <div class="ml-2">
          <div class="text-xl font-bold text-magnum-400">
            {channelData.name}
          </div>

          <div class="text-magnum-100">{channelData.about}</div>
        </div>
        <Metadata
          queryKey={["metadata", text.pubkey]}
          pubkey={text.pubkey}
          let:metadata
        >
          <UserMenu
            slot="loading"
            pubkey={text.pubkey}
            metadata={undefined}
            size={24}
          />

          <UserMenu
            slot="error"
            pubkey={text.pubkey}
            metadata={undefined}
            size={24}
          />

          <UserMenu
            slot="nodata"
            pubkey={text.pubkey}
            metadata={undefined}
            size={24}
          />

          <div><UserMenu pubkey={text.pubkey} {metadata} size={40} /></div>
        </Metadata>
      </div>
    {/if}
  {/await}
</Text>

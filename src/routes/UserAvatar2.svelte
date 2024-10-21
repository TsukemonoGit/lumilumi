<script lang="ts">
  import UserAvatar from "$lib/components/Elements/UserAvatar.svelte";
  import { loginUser, showImg } from "$lib/stores/stores";

  import Avatar from "svelte-boring-avatars";
  import * as Nostr from "nostr-typedef";
  import type { Profile } from "$lib/types";
  import { splitHexColorString } from "$lib/func/util";

  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";

  //let metadata: Nostr.Event;
  //let url = writable<string>();
  export let size = 24;
  const picture = (metadata: Nostr.Event): string | null => {
    if (!metadata) {
      return null;
    }
    try {
      const profile: Profile = JSON.parse(metadata.content);
      return profile.picture || null;
    } catch (error) {
      return null;
    }
  };
  // $: if ($loginUser) {
  //   const observer1 = new QueryObserver($queryClient, {
  //     queryKey: ["metadata", $loginUser],
  //   });
  //   const unsubscribe1 = observer1.subscribe((result: any) => {
  //     if ($queryClient?.getQueryData(["metadata", $loginUser]) as EventPacket) {
  //       metadata = (
  //         $queryClient?.getQueryData(["metadata", $loginUser]) as EventPacket
  //       ).event;
  //       const tmp = picture(metadata);
  //       if (tmp) {
  //         url.set(tmp);
  //       }
  //     }
  //   });
  // }
</script>

{#if $loginUser}
  <div class="my-auto">
    <Metadata
      queryKey={["metadata", $loginUser]}
      pubkey={$loginUser}
      let:metadata
    >
      <div slot="loading">
        <Avatar
          size={size - 4}
          name={$loginUser}
          variant="beam"
          colors={splitHexColorString($loginUser)}
        />
      </div>
      <div slot="nodata">
        <Avatar
          size={size - 4}
          name={$loginUser}
          variant="beam"
          colors={splitHexColorString($loginUser)}
        />
      </div>
      <div slot="error">
        <Avatar
          size={size - 4}
          name={$loginUser}
          variant="beam"
          colors={splitHexColorString($loginUser)}
        />
      </div>
      {@const url = picture(metadata)}
      <div
        style={`width:${size}px;height:${size}px`}
        class="flex justify-center items-center"
      >
        {#if $showImg && metadata && url && url !== ""}
          <UserAvatar
            {url}
            name={metadata.pubkey}
            pubkey={metadata.pubkey}
            size={size - 4}
          />
        {:else}
          <Avatar
            size={size - 4}
            name={$loginUser}
            variant="beam"
            colors={splitHexColorString($loginUser)}
          />
        {/if}
      </div></Metadata
    >
  </div>
{/if}

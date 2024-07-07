<script lang="ts">
  import UserAvatar from "$lib/components/Elements/UserAvatar.svelte";
  import { loginUser, queryClient, showImg } from "$lib/stores/stores";
  import type { EventPacket } from "rx-nostr";
  import Avatar from "svelte-boring-avatars";
  import * as Nostr from "nostr-typedef";
  import type { Profile } from "$lib/types";
  import { splitHexColorString } from "$lib/func/util";
  import { onMount } from "svelte";
  import { QueryObserver } from "@tanstack/svelte-query";
  import { writable } from "svelte/store";

  let metadata: Nostr.Event;
  let url = writable<string>();
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
  $: if ($loginUser) {
    const observer1 = new QueryObserver($queryClient, {
      queryKey: ["metadata", $loginUser],
    });
    const unsubscribe1 = observer1.subscribe((result: any) => {
      if ($queryClient?.getQueryData(["metadata", $loginUser]) as EventPacket) {
        metadata = (
          $queryClient?.getQueryData(["metadata", $loginUser]) as EventPacket
        ).event;
        const tmp = picture(metadata);
        if (tmp) {
          url.set(tmp);
        }
      }
    });
  }
</script>

<div
  style={`width:${size}px;height:${size}px`}
  class="flex justify-center items-center"
>
  {#if $showImg && metadata && $url && $url !== ""}
    <UserAvatar
      bind:url={$url}
      name={metadata.pubkey}
      pubkey={metadata.pubkey}
      size={size - 4}
    />
  {:else if metadata}
    <Avatar
      size={size - 4}
      name={metadata.pubkey}
      variant="beam"
      colors={splitHexColorString(metadata.pubkey)}
    />
  {:else}
    <Avatar size={size - 4} name={"noname"} variant="beam" />
  {/if}
</div>

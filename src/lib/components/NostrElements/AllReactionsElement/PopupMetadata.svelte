<script lang="ts">
  import UserProfile from "$lib/components/NostrMainData/UserProfile.svelte";
  import { showImg } from "$lib/stores/stores";
  import type { Profile } from "$lib/types";

  import * as Nostr from "nostr-typedef";
  export let metadata: Nostr.Event;

  const profile = (metadata: Nostr.Event): Profile | undefined => {
    try {
      return JSON.parse(metadata.content);
    } catch (error) {
      return undefined;
    }
  };
</script>

{#if $showImg}
  <UserProfile pubkey={metadata.pubkey} />
{:else}{/if}

<script lang="ts">
  import { profile, displayShortPub } from "$lib/func/util";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import * as Nostr from "nostr-typedef";

  import { viewport } from "$lib/func/useViewportAction";
  import { followList } from "$lib/stores/globalRunes.svelte";

  interface Props {
    pubhex: string;
  }

  let { pubhex }: Props = $props();

  let petname = $derived(followList.get().get(pubhex));
  let pubString = $derived(displayShortPub(pubhex));
  let hasLoaded = $state(false);
  const handleEnterViewport = () => {
    if (!hasLoaded) {
      //console.log("user name enter viewport", hasLoaded);
      hasLoaded = true;
    }
  };
  // console.log(pubhex);

  const userName = (metadata: Nostr.Event) => {
    const usrProfile = profile(metadata);

    if (
      usrProfile &&
      usrProfile.display_name &&
      usrProfile.display_name !== ""
    ) {
      return usrProfile.display_name;
    }
    if (usrProfile && usrProfile.name && usrProfile.name !== "") {
      return usrProfile.name;
    }

    return pubString;
  };
</script>

<span use:viewport onenterViewport={handleEnterViewport} class="inline-flex"
  >{#if hasLoaded}{#if petname}📛{petname}{:else}@<Metadata
        queryKey={["metadata", pubhex]}
        pubkey={pubhex}
      >
        {#snippet loading()}
          <span class="text-sm inline-flex break-all">{pubString}</span
          >{/snippet}
        {#snippet nodata()}
          <span class="text-sm inline-flex break-all">{pubString}</span>
        {/snippet}
        {#snippet error()}
          <span class="text-sm inline-flex break-all">{pubString}</span>
        {/snippet}
        {#snippet content({ metadata })}
          {userName(metadata)}
        {/snippet}
      </Metadata>{/if}{:else}{pubString}{/if}</span
>

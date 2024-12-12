<script lang="ts">
  import { profile } from "$lib/func/util";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";

  import { encodetoNpub } from "$lib/func/encode";
  import { viewport } from "$lib/func/useViewportAction";
  import { followList } from "$lib/stores/globalRunes.svelte";

  interface Props {
    pubhex: string;
  }

  let { pubhex }: Props = $props();

  let petname = $derived(followList.get?.get(pubhex));
  let loadingText = $derived(encodetoNpub(pubhex));
  let encodePub = $derived(encodetoNpub(pubhex));
  let hasLoaded = $state(false);
  const handleEnterViewport = () => {
    if (!hasLoaded) {
      //console.log("user name enter viewport", hasLoaded);
      hasLoaded = true;
    }
  };
  // console.log(pubhex);
</script>

<span use:viewport onenterViewport={handleEnterViewport} class="inline-flex"
  >{#if hasLoaded}{#if petname}📛{petname}{:else}@<Metadata
        queryKey={["metadata", pubhex]}
        pubkey={pubhex}
      >
        {#snippet loading()}
          <span class="text-sm text-neutral-500 inline-flex break-all"
            >{loadingText}</span
          >{/snippet}
        {#snippet nodata()}
          <span class="text-sm text-neutral-500 inline-flex break-all"
            >{loadingText}</span
          >
        {/snippet}
        {#snippet error()}
          <span class="text-sm text-neutral-500 inline-flex break-all"
            >{loadingText}</span
          >
        {/snippet}
        {#snippet content({ metadata })}
          {profile(metadata)?.name && profile(metadata)?.name !== ""
            ? profile(metadata)?.name
            : profile(metadata)?.display_name}
        {/snippet}
      </Metadata>{/if}{:else}{encodePub}{/if}</span
>

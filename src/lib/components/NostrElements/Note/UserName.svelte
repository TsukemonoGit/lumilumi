<script lang="ts">
  import { nip19 } from "nostr-tools";

  import { profile } from "$lib/func/util";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import { followList } from "$lib/stores/stores";
  import { encodetoNpub } from "$lib/func/encode";
  import viewport from "$lib/func/useViewportAction";
  export let pubhex: string;

  $: petname = $followList?.get(pubhex);
  $: loadingText = encodetoNpub(pubhex);
  $: encodePub = encodetoNpub(pubhex);
  let hasLoaded = false;
  const handleEnterViewport = () => {
    hasLoaded = true;
  };
  //$: console.log(petname);
</script>

<span use:viewport on:enterViewport={handleEnterViewport} class="inline-flex"
  >{#if hasLoaded}{#if petname}📛{petname}{:else}@<Metadata
        queryKey={["metadata", pubhex]}
        pubkey={pubhex}
        let:metadata
        ><span
          slot="loading"
          class="text-sm text-neutral-500 inline-flex break-all"
          >{loadingText}</span
        ><span
          slot="nodata"
          class="text-sm text-neutral-500 inline-flex break-all"
          >{loadingText}</span
        ><span
          slot="error"
          class="text-sm text-neutral-500 inline-flex break-all"
          let:error>{loadingText}</span
        >{profile(metadata)?.name && profile(metadata)?.name !== ""
          ? profile(metadata)?.name
          : profile(metadata)?.display_name}</Metadata
      >{/if}{:else}{encodePub}{/if}</span
>

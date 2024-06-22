<script lang="ts">
  import Counter from "./Counter.svelte";

  import HexToSvg from "./HexToSvg.svelte";
  import NostrMain from "../lib/components/NostrMain.svelte";
  import { calculateColor } from "$lib/func/util";
  import NostrElements from "$lib/components/NostrElements.svelte";
  // import Toast from "$lib/components/Toast.svelte";
  // import Header from "./Header.svelte";
  // const testpub =
  //   "84b0c46ab699ac35eb2ca286470b85e081db2087cdef63932236c397417782f5";

  // const userColor = calculateColor(testpub);
  // import { init as initNostrLogin } from "nostr-login";
  // import { onMount } from "svelte";

  // import { app } from "$lib/stores/stores";
  // import { setRxNostr } from "$lib/func/nostr";
  // import { browser } from "$app/environment";
  // onMount(() => {
  //   // make sure this is called before any
  //   // window.nostr calls are made
  //   if (browser) {
  //     if (!$app?.rxNostr) {
  //       setRxNostr();
  //     }
  //     initNostrLogin({
  //       /*options*/
  //     });
  //   }
  // });
</script>

<svelte:head>
  <title>Lumilumi-Home</title>
  <meta name="description" content="The Nostr webclient" />
</svelte:head>

<section>
  <NostrElements />
</section>

<style>
  .svgset {
    display: flex;
    gap: 4px;
  }
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }
</style>

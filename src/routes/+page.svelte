<script lang="ts">
  import Counter from "./Counter.svelte";

  import HexToSvg from "./HexToSvg.svelte";
  import NostrMain from "../lib/components/NostrMain.svelte";
  import { calculateColor } from "$lib/func/util";
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
  <title>Home</title>
  <meta name="description" content="lumilumi" />
</svelte:head>

<section>
  <NostrMain />
  <div class="svgset flex-wrap">
    <HexToSvg
      hexString={"a3bce095cd0e8348b094c9201bd0c3270eafaf78f776517f4101326daf5cb7ff"}
    />
    <HexToSvg
      hexString={"ef89ee45550f7377284d31e49fc57e5732ffc2b95a7bf35d0f1291d6fa278758"}
    />
    <HexToSvg
      hexString={"ec42c765418b3db9c85abff3a88f4a3bbe57535eebbdc54522041fa5328c0600"}
    />
    <HexToSvg
      hexString={"9e1815dfc010252a17078f9005336bbc047f551d6d7b64545052bceddecb8a2a"}
    />
    <HexToSvg
      hexString={"2c7cc62a697ea3a7826521f3fd34f0cb273693cbe5e9310f35449f43622a5cdc"}
    />
    <HexToSvg
      hexString={"323aaa257b62b1e418a064d19b9925da7f16964de0decc6916fa391fe148ea99"}
    />
    <HexToSvg
      hexString={"2f33f2ee4d29a19ca388e0f217f0ca475a2c9619f7812f16524a2daa297337b9"}
    />
    <HexToSvg
      hexString={"931e1dd90239c78dfbcf0b17e7e7b65f7701ca00d4efd00d1377ae736c463576"}
    />
    <HexToSvg
      hexString={"d4338b7c3306491cfdf54914d1a52b80a965685f7361311eae5f3eaff1d23a5b"}
    />
    <HexToSvg
      hexString={"2f49fd6528a5fb8f919ea6b68f2289bf6a2610077d0d1f5b9b566494c6a8fd57"}
    />
  </div>
  <Counter />
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

<script lang="ts">
  import Counter from "./Counter.svelte";
  import welcome from "$lib/images/svelte-welcome.webp";
  import welcome_fallback from "$lib/images/svelte-welcome.png";

  import HexToSvg from "./HexToSvg.svelte";
  import NostrMain from "../lib/components/NostrMain.svelte";
  import { calculateColor } from "$lib/func/util";
  const testpub =
    "84b0c46ab699ac35eb2ca286470b85e081db2087cdef63932236c397417782f5";

  const userColor = calculateColor(testpub);
  //import { init as initNostrLogin } from "nostr-login";
  import { onMount } from "svelte";
  import { createRxNostr } from "rx-nostr";
  import { app } from "$lib/stores/stores";
  import { setRxNostr } from "$lib/func/nostr";

  onMount(() => {
    // make sure this is called before any
    // window.nostr calls are made
    if (typeof window !== "undefined") {
      if (!$app?.rxNostr) {
        setRxNostr();
      }
      // initNostrLogin({
      //   /*options*/
      // });
    }
  });
</script>

<svelte:head>
  <title>Home</title>
  <meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
  <h1>
    <span class="welcome" style:--usercolor={userColor}>
      <picture>
        <source srcset={welcome} type="image/webp" />
        <img src={welcome_fallback} alt="Welcome" />
      </picture>
    </span>

    to your new<br />SvelteKit app
  </h1>

  <h2>
    try editing <strong>src/routes/+page.svelte</strong>
  </h2>
  <NostrMain />
  <div class="svgset">
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

  h1 {
    width: 100%;
  }

  .welcome {
    display: block;
    position: relative;
    width: 100%;
    height: 0;
    padding: 0 0 calc(100% * 495 / 2048) 0;
    background-color: var(--usercolor);
  }

  .welcome img {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    display: block;
  }
</style>

<script lang="ts">
  import { page } from "$app/stores";
  import Link from "$lib/components/Elements/Link.svelte";
  import { toastSettings } from "$lib/stores/stores";
  import { Share } from "lucide-svelte";
  import Github from "../settings/Github.svelte";

  const handleClickShare = async () => {
    //share link
    const shareData = {
      title: `LUMILUMI the NOSTR client`,
      //  text:  undefined,
      url: $page.url.origin,
    };
    try {
      await navigator.share(shareData);
      // await navigator.clipboard.writeText(
      //   `${$page.url.origin}/channel/${nevent}`
      // );
      $toastSettings = {
        title: "Success",
        description: `shared successfully`,
        color: "bg-green-500",
      };
    } catch (error: any) {
      console.error(error.message);
      $toastSettings = {
        title: "Error",
        description: "Failed to share",
        color: "bg-orange-500",
      };
    }
  };
</script>

<svelte:head>
  <title>Lumilumi-About</title>
  <meta name="description" content="The Nostr webclient" />
</svelte:head>
<!-- <h1 class="title my-4">ABOUT</h1> -->
<section class="border border-magnum-500 rounded-md h-full my-4">
  <h1 class="title my-4 text-center">lumilumi the nostr client</h1>
  <ul>
    <li>
      <div class="list">source code</div>
      <div class="item">
        <Link
          href="https://github.com/TsukemonoGit/lumilumi"
          className="flex gap-1 items-center underline"
        >
          TsukemonoGit/lumilumi<Github size={24} />
        </Link>
      </div>
    </li>
    <li>
      <div class="list">author</div>
      <div class="item">
        <Link
          href="https://lumilumi.vercel.app/npub1sjcvg64knxkrt6ev52rywzu9uzqakgy8ehhk8yezxmpewsthst6sw3jqcw"
          className="flex gap-1 items-center underline"
        >
          @mono
        </Link>
      </div>
    </li>
  </ul>

  <div class="flex gap-2 mt-20 mb-4 flex-wrap justify-center">
    <button
      class="text-magnum-300 gap-1 border border-magnum-600 bg-magnum-900/20 rounded-lg w-32 flex justify-center items-center hover:bg-magnum-900/50 active:bg-magnum-900/80 h-[32px]"
      data-npub="npub1sjcvg64knxkrt6ev52rywzu9uzqakgy8ehhk8yezxmpewsthst6sw3jqcw"
      data-note-id="note15lm4779yy4v7ygdx8dxhgzjuc5ewvsfzw452hew8aq84ztmrgm8q90ks8u"
      data-relays="wss://nostr.mutinywallet.com,wss://bostr.nokotaro.com,wss://relay.nostr.band/"
    >
      Zap⚡️@mono
    </button>

    <button
      on:click={handleClickShare}
      class="text-magnum-300 gap-1 border border-magnum-600 bg-magnum-900/20 rounded-lg w-24 flex justify-center items-center hover:bg-magnum-900/50 active:bg-magnum-900/80 h-[32px]"
      >share<Share size="20" /></button
    >
    <makibishi-component url={$page.url.origin} hide-reaction-list={true}
    ></makibishi-component>
  </div>
</section>

<style lang="postcss">
  li {
    @apply my-4;
  }

  .title {
    display: flex;

    align-items: center;

    color: theme("colors.magnum.400");
    font-weight: 700;
    font-size: var(--text-xl);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-decoration: none;
  }
  .list {
    @apply font-bold my-2 text-lg;
  }
  .item {
    @apply ml-4;
  }

  /* Reset */

  makibishi-component::part(button) {
    background-color: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    appearance: none;
  }

  makibishi-component::part(avatar-link) {
    text-decoration: none;
  }

  /* Theme */

  makibishi-component {
    display: inline-grid;

    grid-auto-flow: column;
    grid-template-rows: 32px;
    grid-template-columns: 32px 32px 1fr;
  }

  makibishi-component::part(button) {
    display: inline-grid;
    place-content: center;
    border: 1px solid;
    /*background-color: #fcfcff;*/
    border-inline-end: none;
    /* border-color: #c8c3ec;*/
    border-radius: 8px 0 0 8px;
    @apply bg-magnum-900/20 border border-magnum-600;
  }

  makibishi-component::part(button):not(:disabled):hover {
    /* background-color: #dceeff; */
    @apply bg-magnum-900/50;
  }

  makibishi-component::part(button):not(:disabled):active {
    /* background-color: #bdd4e9; */
    @apply bg-magnum-900/80;
  }

  makibishi-component::part(button):disabled {
    /* background-color: #cecece; */
    @apply bg-neutral-800;
  }

  makibishi-component::part(counter) {
    display: inline-grid;
    place-content: center;
    font-size: 11px;
    /* background-color: #f1efff; */
    border: 1px solid;
    border-inline-start: none;
    /* border-color: #c8c3ec; */
    border-radius: 0 8px 8px 0;
    @apply bg-neutral-800 border border-magnum-600 text-neutral-50;
  }

  makibishi-component::part(reaction-list) {
    display: inline-flex;
    padding-inline: 4px;
    user-select: none;
  }

  makibishi-component::part(reaction) {
    position: relative;
    display: inline-block;
    width: 26px;
    height: 32px;
  }

  makibishi-component::part(avatar-link) {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
  }

  makibishi-component::part(avatar) {
    border-radius: 999px;
  }

  makibishi-component::part(reaction-content) {
    position: absolute;
    left: -2px;
    bottom: -2px;
    z-index: 2;
    display: inline-grid;
    place-content: center;
    width: 16px;
    height: 16px;
    background-color: white;
    border-radius: 999px;
    font-size: 10px;
  }

  makibishi-component::part(ellipsis) {
    padding-inline: 6px;
  }
</style>

<script>
  import Link from "$lib/components/Elements/Link.svelte";
  import Github from "../settings/Github.svelte";
</script>

<svelte:head>
  <title>Lumilumi-About</title>
  <meta name="description" content="The Nostr webclient" />
</svelte:head>
<!-- <h1 class="title my-4">ABOUT</h1> -->
<section class="border border-magnum-500 rounded-md h-full my-4">
  <h1 class="title my-4">lumilumi the nostr client</h1>
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
</style>

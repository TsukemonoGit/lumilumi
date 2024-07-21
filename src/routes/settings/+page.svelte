<script lang="ts">
  import Link from "$lib/components/Elements/Link.svelte";
  import Settings from "$lib/components/SettingsElements/Settings.svelte";
  import Github from "./Github.svelte";
</script>

<svelte:head>
  <title>Lumilumi-Setting</title>
  <meta property="og:title" content="Lumilumi-settings" />
  <meta property="og:description" content="The Nostr webclient" />
  <meta name="description" content="Lumilumi Setting" />
</svelte:head>
<Settings />
<div class="flex justify-center mt-2 mb-32">
  <Link href="https://github.com/TsukemonoGit/lumilumi">
    <Github size={24} />
  </Link>
</div>

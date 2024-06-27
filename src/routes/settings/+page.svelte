<script lang="ts">
  import Link from "$lib/components/Elements/Link.svelte";
  import Settings from "$lib/components/Settings.svelte";
  import Github from "./Github.svelte";
</script>

<svelte:head>
  <title>lumilumi-Setting</title>
  <meta name="description" content="Lumi Setting" />
</svelte:head>
<Settings />
<div class="flex justify-center mt-2">
  <Link href="https://github.com/TsukemonoGit/lumilumi">
    <Github size={24} />
  </Link>
</div>

<script lang="ts">
  import Link from "$lib/components/Elements/Link.svelte";
  import Settings from "$lib/components/SettingsElements/Settings.svelte";
  import Github from "./Github.svelte";
</script>

<Settings />
<div class="flex justify-center mt-2 mb-32">
  <Link href="https://github.com/TsukemonoGit/lumilumi">
    {#snippet content()}<Github size={24} />{/snippet}
  </Link>
</div>

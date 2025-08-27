<!-- メインコンポーネント -->
<script lang="ts">
  import Link from "$lib/components/Elements/Link.svelte";
  import OgpCard from "$lib/components/Elements/OgpCard.svelte";
  import OGP from "$lib/components/renderSnippets/OGP.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import EmbedSuno from "./Embed/EmbedSuno.svelte";

  const { url } = $props();
  let error = $state(false);

  const onError = () => {
    error = true;
  };

  const sunoDomains = ["suno.ai", "suno.com"];
  const isSunoUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return sunoDomains.some(
        (domain) =>
          urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  };
</script>

<OGP url={url ?? ""}
  >{#snippet renderContent(contents)}
    {@const isSuno = contents.player && isSunoUrl(contents.player)}
    {@const isSunoStream =
      contents.playerStream && isSunoUrl(contents.playerStream)}

    {#if lumiSetting.get().embed && !error && contents.player && isSuno}
      <EmbedSuno url={contents.player} {onError} />
    {:else if lumiSetting.get().embed && !error && contents.playerStream && isSunoStream}
      <EmbedSuno url={contents.playerStream} {onError} />
    {:else if contents.title !== "" || contents.image !== "" || contents.description !== ""}
      <OgpCard {contents} url={url ?? ""} />
    {:else}
      <Link
        props={{ "aria-label": `External Links: ${url}` }}
        className="underline text-magnum-300 break-all "
        href={url ?? ""}>{url ?? ""}</Link
      >
    {/if}
  {/snippet}

  {#snippet nodata()}
    <Link
      props={{ "aria-label": `External Links: ${url}` }}
      className="underline text-magnum-300 break-all hover:opacity-80"
      href={url ?? ""}>{url ?? ""}</Link
    >
  {/snippet}
</OGP>

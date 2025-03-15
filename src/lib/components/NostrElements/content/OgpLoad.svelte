<script lang="ts">
  import Link from "$lib/components/Elements/Link.svelte";
  import OgpCard from "$lib/components/Elements/OgpCard.svelte";
  import OGP from "$lib/components/renderSnippets/OGP.svelte";
  let { url } = $props();
</script>

<OGP url={url ?? ""}
  >{#snippet renderContent(contents)}
    {#if contents.title !== "" || contents.image !== "" || contents.description !== ""}<!--OGP表示はTITLE必須にしておくと思ったけどそしたらXのOGPでてこなくなったから-->
      <OgpCard {contents} url={url ?? ""} />{:else}<Link
        props={{ "aria-label": `External Links: ${url}` }}
        className="underline text-magnum-300 break-all "
        href={url ?? ""}>{url ?? ""}</Link
      >{/if}{/snippet}
  {#snippet nodata()}
    <Link
      props={{ "aria-label": `External Links: ${url}` }}
      className="underline text-magnum-300 break-all hover:opacity-80"
      href={url ?? ""}>{url ?? ""}</Link
    >{/snippet}
</OGP>

<script lang="ts">
  import Link from "$lib/components/Elements/Link.svelte";
  import { followList, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";

  let videoError: boolean = $state(false);
  let videoLoad: boolean = $state(false);

  interface Props {
    url: string;

    author: string;
  }

  let {
    url,

    author,
  }: Props = $props();

  let view = $state(false);
  let showDirectly = $derived(
    lumiSetting.get().imageAutoExpand === "all" ||
      (lumiSetting.get().imageAutoExpand === "following" &&
        author &&
        (author === lumiSetting.get().pubkey || followList.get().has(author)))
  );
</script>

{#if (lumiSetting.get().showImg && showDirectly && !videoError) || view}
  {#if !videoLoad}
    <Link
      props={{ "aria-label": `External Links: ${url}` }}
      className="underline text-magnum-300 break-all"
      href={url ?? ""}>{url}</Link
    >
  {/if}
  <div>
    <video
      aria-label="video contents"
      width="288"
      height="200"
      class="max-w-[min(18rem,100%)] max-h-[18rem] object-contain overflow-hidden"
      src={url}
      controls
      preload="metadata"
      onloadeddata={() => (videoLoad = true)}
      onerror={() => (videoError = true)}
      ><track default kind="captions" />
      Sorry, your browser doesn't support embedded videos.
    </video>
  </div>
{:else if videoError}
  <Link
    props={{ "aria-label": `External Links: ${url}` }}
    className="underline text-magnum-300 break-all"
    href={url ?? ""}>{url}</Link
  >
{:else}
  <button
    class="rounded-md border font-semibold border-magnum-600 text-magnum-200 p-1 m-1 hover:opacity-75 active:opacity-50"
    onclick={() => (view = true)}>Expand Video</button
  >
{/if}

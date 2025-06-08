<script lang="ts">
  import Link from "$lib/components/Elements/Link.svelte";
  import UrlType from "$lib/components/renderSnippets/UrlType.svelte";
  import type { Part } from "$lib/func/content";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import Content3D from "./Content3D.svelte";
  import ContentImage from "./ContentImage.svelte";
  import { isvalidURL } from "$lib/func/ogp";
  import MediaEmbedSwitcher from "./MediaEmbedSwitcher.svelte";
  import ContentVideo from "./ContentVideo.svelte";

  interface Props {
    part: Part;
    openModal: (index: number) => void;
    author: string;
  }
  let { part, openModal, author }: Props = $props();
</script>

{#if part.url}
  <UrlType url={part.url}>
    {#snippet loading()}
      <Link
        props={{ "aria-label": `External Links: ${part.url}` }}
        className="underline text-magnum-300 break-all hover:opacity-80"
        href={part.content ?? ""}>{part.content}</Link
      >
    {/snippet}
    {#snippet content(type)}
      {#if type === "image"}
        <!-- <ContentOneImage url={part.url ?? ""} /> -->
        <ContentImage
          src={part.url}
          url={part.url}
          number={part.number}
          {openModal}
          {author}
        />
      {:else if type === "movie"}
        <ContentVideo
          src={part.content}
          url={part.url}
          number={part.number}
          {author}
        />
      {:else if type === "audio"}
        {#if lumiSetting.get().showImg}
          <audio
            aria-label="audio contents"
            controls
            src={part.content}
            class=" object-contain max-w-[min(20rem,100%)] max-h-80"
            ><track default kind="captions" /></audio
          >
        {:else}<Link
            props={{ "aria-label": `External Links: ${part.url}` }}
            className="underline text-magnum-300 break-all hover:opacity-80"
            href={part.content ?? ""}>{part.content}</Link
          >{/if}
      {:else if type === "3D"}
        <Content3D content={part.content} url={part.url} />
      {:else if type === "url"}
        {#if lumiSetting.get().showImg && isvalidURL(part.content || "")}<MediaEmbedSwitcher
            {author}
            url={part.url || ""}
          />{:else}<Link
            props={{ "aria-label": `External Links: ${part.url}` }}
            className="underline text-magnum-300 break-all hover:opacity-80"
            href={part.content ?? ""}>{part.content}</Link
          >{/if}
      {:else}
        <span
          class="whitespace-pre-wrap break-words"
          style="word-break: break-word;">{part.content}</span
        >
      {/if}
    {/snippet}
  </UrlType>
{/if}

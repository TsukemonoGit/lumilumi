<script lang="ts">
  import Link from "$lib/components/Elements/Link.svelte";
  import OgpCard from "$lib/components/Elements/OgpCard.svelte";
  import UrlType from "$lib/components/renderSnippets/UrlType.svelte";
  import type { Part } from "$lib/func/content";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import Content3D from "./Content3D.svelte";
  import ContentImage from "./ContentImage.svelte";
  import OGP from "$lib/components/renderSnippets/OGP.svelte";
  import { isvalidURL } from "$lib/func/ogp";

  interface Props {
    part: Part;
    openModal: (index: number) => void;
  }
  let { part, openModal }: Props = $props();
</script>

{#if part.url}
  <UrlType url={part.url}>
    {#snippet loading()}
      <Link
        props={{ "aria-label": `External Links: ${part.url}` }}
        className="underline text-magnum-300 break-all hover:opacity-80"
        href={part.content ?? ""}
        >{#snippet content()}{part.content}{/snippet}</Link
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
        />
      {:else if type === "movie"}
        {#if lumiSetting.get().showImg}
          <video
            aria-label="video contents"
            controls
            src={part.content}
            class=" object-contain max-w-[min(20rem,100%)] max-h-80"
            ><track default kind="captions" /></video
          >
        {:else}<Link
            props={{ "aria-label": `External Links: ${part.url}` }}
            className="underline text-magnum-300 break-all hover:opacity-80"
            href={part.content ?? ""}
            >{#snippet content()}{part.content}{/snippet}</Link
          >{/if}
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
            href={part.content ?? ""}
            >{#snippet content()}{part.content}{/snippet}</Link
          >{/if}
      {:else if type === "3D"}
        <Content3D content={part.content} url={part.url} />
      {:else if type === "url"}
        {#if lumiSetting.get().showImg && isvalidURL(part.content || "")}<OGP
            url={part.content ?? ""}
            >{#snippet renderContent(contents)}
              {#if contents.title !== "" || contents.image !== "" || contents.description !== ""}<!--OGP表示はTITLE必須にしておくと思ったけどそしたらXのOGPでてこなくなったから-->
                <OgpCard {contents} url={part.content ?? ""} />{:else}<Link
                  props={{ "aria-label": `External Links: ${part.url}` }}
                  className="underline text-magnum-300 break-all "
                  href={part.content ?? ""}
                  >{#snippet content()}{part.content ?? ""}{/snippet}</Link
                >{/if}{/snippet}
            {#snippet nodata()}
              <Link
                props={{ "aria-label": `External Links: ${part.url}` }}
                className="underline text-magnum-300 break-all hover:opacity-80"
                href={part.content ?? ""}
                >{#snippet content()}{part.content ?? ""}{/snippet}</Link
              >{/snippet}
          </OGP>{:else}<Link
            props={{ "aria-label": `External Links: ${part.url}` }}
            className="underline text-magnum-300 break-all hover:opacity-80"
            href={part.content ?? ""}
            >{#snippet content()}{part.content}{/snippet}</Link
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

<script lang="ts">
  import { isvalidURL, type Ogp } from "$lib/func/ogp";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  import Avatar from "svelte-boring-avatars";
  import LinkCheck from "./LinkCheck.svelte";

  interface Props {
    contents: Ogp;
    url: string;
  }

  let { contents, url }: Props = $props();

  let imageURL = $state(
    isvalidURL(contents.image) ? contents.image : undefined
  );
  let favicon = $state(
    isvalidURL(contents.favicon) ? contents.favicon : undefined
  );
  let hostname = $derived(isvalidURL(url) ? new URL(url).hostname : "");
</script>

<LinkCheck {url}>
  {#snippet ok()}
    {@render linkCard(true)}
  {/snippet}

  {#snippet ng()}
    {@render linkCard(false)}
  {/snippet}
</LinkCheck>

{#snippet linkCard(isValid: boolean)}
  {@const borderColor = isValid ? "border-magnum-400" : "border-neutral-400"}
  {@const divideColor = isValid ? "divide-magnum-400" : "divide-neutral-400"}
  {@const hoverClass = isValid ? "hover:opacity-80" : ""}

  <!-- 共通のコンテンツ部分 -->
  {#snippet cardContent()}
    {#if lumiSetting.get().showImg && imageURL}
      <blockquote
        class="grid grid-cols-[0.5fr_1.5fr] divide-x {divideColor} w-full"
      >
        <figure class="overflow-hidden flex items-center justify-center">
          <img
            loading="lazy"
            height="128"
            width="128"
            class="object-contain max-h-[8rem] max-w-full overflow-hidden"
            src={imageURL}
            alt=""
            onerror={() => (imageURL = undefined)}
          />
        </figure>

        {@render textContent()}
      </blockquote>
    {:else}
      <blockquote class="p-0.5 grid grid-rows-[auto_1fr] w-full">
        {@render textContent()}
      </blockquote>
    {/if}
  {/snippet}

  <!-- テキスト部分 -->
  {#snippet textContent()}
    <div class="p-0.5 pl-1 grid grid-rows-[auto_1fr] w-full">
      <h2 class="line-clamp-2 text-sm font-bold text-magnum-200">
        {contents.title}
      </h2>
      <p
        class="line-clamp-6 text-xs text-magnum-400 max-w-full"
        style="white-space: pre-wrap; word-break: break-word;"
      >
        {contents.description}
      </p>
      <div class="flex flex-row-reverse">
        {#if favicon}
          {#if lumiSetting.get().showImg && imageURL}
            <img
              width="20"
              height="20"
              loading="lazy"
              class="object-contain w-5 pl-0.5 pr-0.5"
              src={favicon}
              alt=""
            />
          {:else}
            <Avatar size={20} name={favicon} variant="beam" />
          {/if}
        {/if}
        <p class="text-xs text-magnum-300">
          {#if contents.memo}
            {contents.memo} /
          {/if}
          {hostname}
        </p>
      </div>
    </div>
  {/snippet}

  <!-- メインの要素（aタグかdivタグか） -->
  {#if isValid}
    <a
      class="rounded-lg m-1 {hoverClass} break-all {borderColor} border overflow-hidden flex w-auto"
      href={url}
      title={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {@render cardContent()}
    </a>
  {:else}
    <div
      class="rounded-lg m-1 break-all {borderColor} border overflow-hidden flex w-auto"
    >
      {@render cardContent()}
    </div>
  {/if}
{/snippet}

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
  //  {#if isvalidURL(url)}{new URL(url).hostname}{/if}
  let hostname = $derived(isvalidURL(url) ? new URL(url).hostname : "");
</script>

<LinkCheck {url}>
  {#snippet ok()}
    <a
      class=" rounded-lg m-1 hover:opacity-80 break-all border border-magnum-400 overflow-hidden flex w-auto"
      href={url}
      title={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {#if lumiSetting.get().showImg && imageURL}
        <blockquote
          class="grid grid-cols-[0.5fr_1.5fr] divide-x divide-magnum-400 w-full"
        >
          <figure class=" overflow-hidden flex items-center justify-center">
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

          <div class="p-0.5 pl-1 grid grid-rows-[auto_1fr] w-full">
            <h2 class="line-clamp-2 text-sm font-bold text-magnum-200">
              {contents.title}
            </h2>
            <p
              class="line-clamp-6 text-xs text-magnum-400 max-w-full"
              style="	white-space: pre-wrap; word-break: break-word;"
            >
              {contents.description}
            </p>
            <div class="flex flex-row-reverse">
              {#if favicon}
                <img
                  width="20"
                  height="20"
                  loading="lazy"
                  class="object-contain w-5 pl-0.5 pr-0.5"
                  src={favicon}
                  alt=""
                />{/if}
              <p class="text-xs text-magnum-300">
                {#if contents.memo}
                  {contents.memo} /
                {/if}
                {hostname}
              </p>
            </div>
          </div>
        </blockquote>
      {:else}<blockquote class="p-0.5 grid grid-rows-[auto_1fr] w-full">
          <h2 class="line-clamp-2 text-sm font-bold text-magnum-200">
            {contents.title}
          </h2>
          <p
            class="line-clamp-6 text-xs text-magnum-400 max-w-full"
            style="	white-space: pre-wrap; word-break: break-word;"
          >
            {contents.description}
          </p>
          <div class="flex flex-row-reverse">
            {#if favicon}
              <Avatar size={20} name={favicon} variant="beam" />
            {/if}
            <p class="text-xs text-magnum-300">
              {#if contents.memo}
                {contents.memo} /
              {/if}
              {hostname}
            </p>
          </div>
        </blockquote>{/if}
    </a>
  {/snippet}
  {#snippet ng()}
    <div
      class=" rounded-lg m-1 break-all border border-neutral-400 overflow-hidden flex w-auto"
    >
      {#if lumiSetting.get().showImg && imageURL}
        <blockquote
          class="grid grid-cols-[0.5fr_1.5fr] divide-x divide-neutral-400 w-full"
        >
          <figure class=" overflow-hidden flex items-center justify-center">
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

          <div class="p-0.5 pl-1 grid grid-rows-[auto_1fr] w-full">
            <h2 class="line-clamp-2 text-sm font-bold text-magnum-200">
              {contents.title}
            </h2>
            <p
              class="line-clamp-6 text-xs text-magnum-400 max-w-full"
              style="	white-space: pre-wrap; word-break: break-word;"
            >
              {contents.description}
            </p>
            <div class="flex flex-row-reverse">
              {#if favicon}
                <img
                  width="20"
                  height="20"
                  loading="lazy"
                  class="object-contain w-5 pl-0.5 pr-0.5"
                  src={favicon}
                  alt=""
                />{/if}
              <p class="text-xs text-magnum-300">
                {#if contents.memo}
                  {contents.memo} /
                {/if}
                {hostname}
              </p>
            </div>
          </div>
        </blockquote>
      {:else}<blockquote class="p-0.5 grid grid-rows-[auto_1fr] w-full">
          <h2 class="line-clamp-2 text-sm font-bold text-magnum-200">
            {contents.title}
          </h2>
          <p
            class="line-clamp-6 text-xs text-magnum-400 max-w-full"
            style="	white-space: pre-wrap; word-break: break-word;"
          >
            {contents.description}
          </p>
          <div class="flex flex-row-reverse">
            {#if favicon}
              <Avatar size={20} name={favicon} variant="beam" />
            {/if}
            <p class="text-xs text-magnum-300">
              {#if contents.memo}
                {contents.memo} /
              {/if}
              {hostname}
            </p>
          </div>
        </blockquote>{/if}
    </div>
  {/snippet}
</LinkCheck>

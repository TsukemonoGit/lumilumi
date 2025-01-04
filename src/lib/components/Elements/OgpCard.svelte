<script lang="ts">
  import { isvalidURL, type Ogp } from "$lib/func/ogp";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  import Avatar from "svelte-boring-avatars";

  interface Props {
    contents: Ogp;
    url: string;
  }

  let { contents, url }: Props = $props();

  let imageURL = $state(contents.image);
  //  {#if isvalidURL(url)}{new URL(url).hostname}{/if}
  let hostname = $derived(isvalidURL(url) ? new URL(url).hostname : "");
</script>

<!--bg-magnum-300 text-magnum-800  text-magnum-700 drop-shadow-md-->
<!-- <div
  class=" rounded-lg m-1 hover:opacity-80 z-20 break-all border border-magnum-300 overflow-hidden"
> -->
<a
  class=" rounded-lg m-1 hover:opacity-80 z-20 break-all border border-magnum-400 overflow-hidden flex w-auto"
  href={url}
  title={url}
  target="_blank"
  rel="noopener noreferrer"
>
  {#if lumiSetting.get().showImg && imageURL && imageURL !== ""}
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
          onerror={() => (imageURL = "")}
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
          <img
            width="20"
            height="20"
            loading="lazy"
            class="object-contain w-5 pl-0.5 pr-0.5"
            src={contents.favicon}
            alt=""
          />
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
        <Avatar size={20} name={contents.favicon} variant="beam" />

        <p class="text-xs text-magnum-300">
          {#if contents.memo}
            {contents.memo} /
          {/if}
          {hostname}
        </p>
      </div>
    </blockquote>{/if}
</a>
<!-- </div> -->

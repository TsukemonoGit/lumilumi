<script lang="ts">
  import { isvalidURL, type Ogp } from "$lib/func/ogp";
  import { showImg } from "$lib/stores/stores";
  import Avatar from "svelte-boring-avatars";

  export let contents: Ogp;
  export let url: string;
</script>

<div
  class="drop-shadow-md rounded-xl m-1 p-1 border border-magnum-400 hover:opacity-90 z-20 break-all bg-magnum-200"
>
  <a class="" href={contents.url} target="_blank">
    <div class="grid grid-rows-[auto_1fr]">
      {#if $showImg && contents.image}
        <div class="grid grid-cols-[0.5fr_1.5fr] gap-0.5">
          <div
            class="overflow-hidden relative rounded-xl max-h-[6rem] flex justify-center"
          >
            <img
              loading="lazy"
              class="object-contain max-h-[6rem] max-w-full"
              src={contents.image}
              alt=""
            />
          </div>
          <div class="p-0.5 grid grid-rows-[auto_1fr] z-10 w-full">
            <div class="line-clamp-2 text-sm font-bold text-magnum-800">
              {contents.title}
            </div>
            <div
              class="line-clamp-4 text-xs text-magnum-700 max-w-full"
              style="	white-space: pre-wrap; word-break: break-word;"
            >
              {contents.description}
            </div>
          </div>
        </div>
      {:else}<div class="p-0.5 grid grid-rows-[auto_1fr] z-10 w-full">
          <div class="line-clamp-2 text-sm font-bold text-magnum-700">
            {contents.title}
          </div>
          <div
            class="line-clamp-4 text-xs text-magnum-700 max-w-full"
            style="	white-space: pre-wrap; word-break: break-word;"
          >
            {contents.description}
          </div>
        </div>{/if}
      <div class="flex flex-row-reverse ... -my-1">
        {#if $showImg && contents.image !== ""}
          <img
            loading="lazy"
            class="object-contain w-5 pl-0.5 pr-0.5"
            src={contents.image}
            alt=""
          />
        {:else}
          <Avatar
            class=" object-contain w-5 pl-0.5 pr-0.5"
            name={contents.image}
            variant="beam"
          />
        {/if}
        <div class="text-xs text-magnum-600">
          {#if contents.memo}
            {contents.memo} /
          {/if}
          {#if isvalidURL(url)}{new URL(url).hostname}{/if}
        </div>
      </div>
    </div>
  </a>
</div>

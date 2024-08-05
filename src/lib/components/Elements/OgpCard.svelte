<script lang="ts">
  import { isvalidURL, type Ogp } from "$lib/func/ogp";
  import { showImg } from "$lib/stores/stores";
  import Avatar from "svelte-boring-avatars";

  export let contents: Ogp;
  export let url: string;
</script>

<!--bg-magnum-200 text-magnum-800  text-magnum-700 drop-shadow-md-->
<div
  class=" rounded-lg m-1 hover:opacity-80 z-20 break-all border border-magnum-200 overflow-hidden"
>
  <a class="" href={url} title={url} target="_blank" rel="noopener noreferrer">
    {#if $showImg && contents.image && contents.image !== ""}
      <div class="grid grid-cols-[0.5fr_1.5fr] divide-x divide-magnum-200">
        <div class="overflow-hidden max-h-[8rem] flex justify-center">
          <img
            loading="lazy"
            class="object-contain max-h-[8rem] max-w-full"
            src={contents.image}
            alt=""
          />
        </div>
        <div class="p-0.5 pl-1 grid grid-rows-[auto_1fr] w-full">
          <div class="line-clamp-2 text-sm font-bold text-magnum-200">
            {contents.title}
          </div>
          <div
            class="line-clamp-6 text-xs text-magnum-300 max-w-full"
            style="	white-space: pre-wrap; word-break: break-word;"
          >
            {contents.description}
          </div>
          <div class="flex flex-row-reverse">
            <img
              loading="lazy"
              class="object-contain w-5 pl-0.5 pr-0.5"
              src={contents.favicon}
              alt=""
            />
            <div class="text-xs text-magnum-200">
              {#if contents.memo}
                {contents.memo} /
              {/if}
              {#if isvalidURL(url)}{new URL(url).hostname}{/if}
            </div>
          </div>
        </div>
      </div>
    {:else}<div class="p-0.5 grid grid-rows-[auto_1fr] w-full">
        <div class="line-clamp-2 text-sm font-bold text-magnum-200">
          {contents.title}
        </div>
        <div
          class="line-clamp-6 text-xs text-magnum-300 max-w-full"
          style="	white-space: pre-wrap; word-break: break-word;"
        >
          {contents.description}
        </div>
        <div class="flex flex-row-reverse">
          <div class="object-contain w-5 pl-0.5 pr-0.5">
            <Avatar size={20} name={contents.favicon} variant="beam" />
          </div>
          <div class="text-xs text-magnum-200">
            {#if contents.memo}
              {contents.memo} /
            {/if}
            {#if isvalidURL(url)}{new URL(url).hostname}{/if}
          </div>
        </div>
      </div>{/if}
  </a>
</div>

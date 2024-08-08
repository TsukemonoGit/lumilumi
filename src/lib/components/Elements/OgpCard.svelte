<script lang="ts">
  import { isvalidURL, type Ogp } from "$lib/func/ogp";
  import { showImg } from "$lib/stores/stores";
  import Avatar from "svelte-boring-avatars";

  export let contents: Ogp;
  export let url: string;
</script>

<!--bg-magnum-200 text-magnum-800  text-magnum-700 drop-shadow-md-->
<!-- <div
  class=" rounded-lg m-1 hover:opacity-80 z-20 break-all border border-magnum-200 overflow-hidden"
> -->
<a
  class=" rounded-lg m-1 hover:opacity-80 z-20 break-all border border-magnum-200 overflow-hidden flex w-auto"
  href={url}
  title={url}
  target="_blank"
  rel="noopener noreferrer"
>
  {#if $showImg && contents.image && contents.image !== ""}
    <blockquote
      class="grid grid-cols-[0.5fr_1.5fr] divide-x divide-magnum-200 w-full"
    >
      <figure class=" overflow-hidden flex items-center justify-center">
        <img
          loading="lazy"
          class="object-contain max-h-[8rem] max-w-full overflow-hidden"
          src={contents.image}
          alt=""
        />
      </figure>

      <div class="p-0.5 pl-1 grid grid-rows-[auto_1fr] w-full">
        <h2 class="line-clamp-2 text-sm font-bold text-magnum-200">
          {contents.title}
        </h2>
        <p
          class="line-clamp-6 text-xs text-magnum-300 max-w-full"
          style="	white-space: pre-wrap; word-break: break-word;"
        >
          {contents.description}
        </p>
        <div class="flex flex-row-reverse">
          <img
            loading="lazy"
            class="object-contain w-5 pl-0.5 pr-0.5"
            src={contents.favicon}
            alt=""
          />
          <p class="text-xs text-magnum-200">
            {#if contents.memo}
              {contents.memo} /
            {/if}
            {#if isvalidURL(url)}{new URL(url).hostname}{/if}
          </p>
        </div>
      </div>
    </blockquote>
  {:else}<blockquote class="p-0.5 grid grid-rows-[auto_1fr] w-full">
      <h2 class="line-clamp-2 text-sm font-bold text-magnum-200">
        {contents.title}
      </h2>
      <p
        class="line-clamp-6 text-xs text-magnum-300 max-w-full"
        style="	white-space: pre-wrap; word-break: break-word;"
      >
        {contents.description}
      </p>
      <div class="flex flex-row-reverse">
        <Avatar
          class="object-contain w-5 pl-0.5 pr-0.5"
          size={20}
          name={contents.favicon}
          variant="beam"
        />

        <p class="text-xs text-magnum-200">
          {#if contents.memo}
            {contents.memo} /
          {/if}
          {#if isvalidURL(url)}{new URL(url).hostname}{/if}
        </p>
      </div>
    </blockquote>{/if}
</a>
<!-- </div> -->

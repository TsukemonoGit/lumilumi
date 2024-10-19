<script lang="ts">
  import { type Part } from "$lib/func/content";

  import { showImg } from "$lib/stores/stores";

  import { _ } from "svelte-i18n";

  export let part: Part;
  let imgError: boolean = false;
  let imgLoad: boolean = false;
  ///console.log(imgError);
  //console.log(imgLoad);
</script>

{#if $showImg && !imgError}{#if !imgLoad}:{part.content}:{/if}<img
    height="24"
    loading="lazy"
    alt={`:${part.content}:`}
    src={part.url}
    title={`:${part.content}:`}
    class="inline h-[24px] object-contain m-0 overflow-hidden"
    on:load={() => {
      //console.log("load");

      imgLoad = true;
    }}
    on:error={() => {
      //console.log("error");
      imgError = true;
    }}
  />{:else}:{part.content}:{/if}

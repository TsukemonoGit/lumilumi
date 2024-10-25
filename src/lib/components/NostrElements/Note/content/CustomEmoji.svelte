<script lang="ts">
  import { type Part } from "$lib/func/content";

  import { showImg } from "$lib/stores/stores";

  import { _ } from "svelte-i18n";

  export let part: Part;
  export let height: number = 24;
  let imgError: boolean = false;
  let imgLoad: boolean = false;
  ///console.log(imgError);
  //console.log(imgLoad);
</script>

{#if $showImg && !imgError}{#if !imgLoad}:{part.content}:{/if}<img
    height={`${height}px`}
    loading="lazy"
    alt={`:${part.content}:`}
    src={part.url}
    title={`:${part.content}:`}
    class={`inline object-contain m-0 overflow-hidden`}
    style={`height:${height}px`}
    on:load={() => {
      //console.log("load");

      imgLoad = true;
    }}
    on:error={() => {
      //console.log("error");
      imgError = true;
    }}
  />{:else}:{part.content}:{/if}

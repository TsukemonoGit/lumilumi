<script lang="ts">
  import { type Part } from "$lib/func/content";

  import { showImg } from "$lib/stores/stores";

  import { _ } from "svelte-i18n";

  interface Props {
    part: Part;
    height?: number;
  }

  let { part, height = 24 }: Props = $props();
  let imgError: boolean = $state(false);
  let imgLoad: boolean = $state(false);
  ///console.log(imgError);
  //console.log(imgLoad);
</script>

{#if $showImg && !imgError}{#if !imgLoad}:{part.content}:{/if}<img
    height={`${height}px`}
    loading="lazy"
    alt={`:${part.content}:`}
    src={part.url}
    title={`:${part.content}:`}
    class={`inline object-contain m-0 overflow-hidden align-bottom`}
    style={`height:${height}px`}
    onload={() => {
      //console.log("load");

      imgLoad = true;
    }}
    onerror={() => {
      //console.log("error");
      imgError = true;
    }}
  />{:else}:{part.content}:{/if}

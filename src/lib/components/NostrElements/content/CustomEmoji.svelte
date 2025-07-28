<script lang="ts">
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import type { Token } from "@konemono/nostr-content-parser";

  import { t as _ } from "@konemono/svelte5-i18n";

  interface Props {
    part: Token;
    height?: number;
  }

  let { part, height = 24 }: Props = $props();
  let imgError: boolean = $state(false);
  let imgLoad: boolean = $state(false);
</script>

{#if part.metadata && part.metadata.url && lumiSetting.get().showImg && !imgError}{#if !imgLoad}{part.content}{/if}<img
    height={`${height}px`}
    loading="lazy"
    alt={`${part.content}`}
    src={part.metadata!.url as string}
    title={`${part.content}`}
    class={`inline object-contain m-0 overflow-hidden align-bottom`}
    style={`height:${height}px`}
    onload={() => {
      imgLoad = true;
    }}
    onerror={() => {
      imgError = true;
    }}
  />{:else}{part.content}{/if}

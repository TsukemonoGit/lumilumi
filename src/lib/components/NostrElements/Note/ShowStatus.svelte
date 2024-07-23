<script lang="ts">
  import Link from "$lib/components/Elements/Link.svelte";
  import { Music, TrendingUp } from "lucide-svelte";
  import StatusGeneral from "./StatusGeneral.svelte";
  import StatusMusic from "./StatusMusic.svelte";

  export let pubkey: string;
</script>

<div class="text-sm text-zinc-500">
  <StatusGeneral {pubkey} let:event>
    <!-- <div slot="loading">loading</div>
    <div slot="nodata">nodata</div>
    <div slot="error">error</div> -->

    {@const link = event.tags.find((tag) => tag[0] === "r")?.[1] ?? ""}
    <div class="flex gap-2 items-center">
      {#if link !== ""}
        <TrendingUp class="min-w-[16px] min-[16px] w-[16px]" /><a
          class="underline"
          target="_blank"
          rel="noopener noreferrer"
          title={link}
          href={link}>{event.content ?? "link"}</a
        >
      {:else if event.content !== ""}
        <TrendingUp class="h-[16px] w-[16px]" />{event.content}
      {/if}
    </div>
  </StatusGeneral>
  <StatusMusic {pubkey} let:event>
    <!-- <div slot="loading">loading</div>
    <div slot="nodata">nodata</div>
    <div slot="error">error</div> -->
    {@const link = event.tags.find((tag) => tag[0] === "r")?.[1] ?? ""}
    <div class="flex gap-2 items-center">
      {#if link !== ""}<Music class="min-w-[16px] min-[16px] w-[16px]" /><a
          class="underline"
          target="_blank"
          rel="noopener noreferrer"
          title={link}
          href={link}>{event.content ?? "link"}</a
        >
      {:else if event.content !== ""}
        <Music class="h-[16px] w-[16px]" />{event.content}
      {/if}
    </div>
  </StatusMusic>
</div>

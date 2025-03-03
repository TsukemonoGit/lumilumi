<script lang="ts">
  import { Music } from "lucide-svelte";
  import EllipsisMenu from "../NoteActionButtuns/EllipsisMenu.svelte";
  import * as Nostr from "nostr-typedef";

  interface Props {
    link: string | undefined;
    event: Nostr.Event;
    tieKey: string | undefined;
    color?: string | undefined;
  }
  let { link, event, tieKey, color }: Props = $props();
  let deleted = $state(false);
</script>

{#if (link !== "" || event.content.trim() !== "") && !deleted}
  <div class=" min-w-[16px] h-[16px]">
    <EllipsisMenu
      {tieKey}
      TriggerIcon={Music}
      note={event}
      iconSize={16}
      iconClass={color ?? "text-zinc-500"}
      bind:deleted
    />
  </div>
  {#if link !== ""}
    <a
      class="underline"
      target="_blank"
      rel="noopener noreferrer"
      title={link}
      href={link}
    >
      <div
        class="truncate line-clamp-2 max-w-full"
        style="white-space: pre-wrap; word-break: break-word;"
      >
        {event.content ?? "link"}
      </div>
    </a>
  {:else}
    <div
      class="truncate line-clamp-2 max-w-full"
      style="white-space: pre-wrap; word-break: break-word;"
    >
      {event.content.trim() !== "" ? event.content.trim() : "link"}
    </div>
  {/if}
{/if}

<script lang="ts">
  import { TrendingUp } from "lucide-svelte";
  import EllipsisMenu from "../NoteActionButtuns/EllipsisMenu.svelte";
  import * as Nostr from "nostr-typedef";
  import DisplayName from "../../user/DisplayName.svelte";

  interface Props {
    link: string | undefined;
    event: Nostr.Event;

    color?: string | undefined;
  }
  const { link, event, color }: Props = $props();
  let deleted = $state(false);
</script>

{#if ((link && link !== "") || event.content.trim() !== "") && !deleted}
  <div class=" min-w-[16px] h-[16px]">
    <EllipsisMenu
      TriggerIcon={TrendingUp}
      note={event}
      iconSize={16}
      iconClass={color ?? "text-zinc-500"}
      bind:deleted
    />
  </div>
  {#if link && link !== ""}
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
        <DisplayName
          height={20}
          name={event.content || link}
          tags={event.tags}
        />
      </div>
    </a>
  {:else}
    <div
      class="truncate line-clamp-2 max-w-full"
      style="white-space: pre-wrap; word-break: break-word;"
    >
      <DisplayName height={20} name={event.content} tags={event.tags} />
    </div>
  {/if}
{/if}

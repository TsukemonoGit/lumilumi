<script lang="ts">
  import { CircleHelp } from "lucide-svelte";
  import EllipsisMenu from "../NoteActionButtuns/EllipsisMenu.svelte";
  import * as Nostr from "nostr-typedef";
  import DisplayName from "../../user/DisplayName.svelte";

  interface Props {
    link: string | undefined;
    event: Nostr.Event;
  }
  let { link, event }: Props = $props();
  let deleted = $state(false);
</script>

{#if link && link !== "" && !deleted}
  <div class=" min-w-[16px] h-[16px]">
    <EllipsisMenu
      TriggerIcon={CircleHelp}
      note={event}
      iconSize={16}
      iconClass="text-zinc-500"
      bind:deleted
    />
  </div>
  <a
    class="underline"
    target="_blank"
    rel="noopener noreferrer"
    title={link}
    href={link}
    ><div
      class="truncate line-clamp-2 max-w-full"
      style="	white-space: pre-wrap; word-break: break-word;"
    >
      <DisplayName height={20} name={event.content || link} tags={event.tags} />
    </div></a
  >
{:else if event.content.trim() !== ""}
  <div class=" min-w-[16px] h-[16px]">
    <EllipsisMenu
      TriggerIcon={CircleHelp}
      note={event}
      iconSize={16}
      iconClass="text-zinc-500"
      bind:deleted
    />
  </div>
  <div
    class="truncate line-clamp-2 max-w-full"
    style="	white-space: pre-wrap; word-break: break-word;"
  >
    <DisplayName height={20} name={event.content} tags={event.tags} />
  </div>
{/if}

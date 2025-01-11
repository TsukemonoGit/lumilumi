<script lang="ts">
  import { Music } from "lucide-svelte";
  import EllipsisMenu from "../NoteActionButtuns/EllipsisMenu.svelte";
  import * as Nostr from "nostr-typedef";

  interface Props {
    link: string | undefined;
    event: Nostr.Event;
    tieKey: string | undefined;
  }
  let { link, event, tieKey }: Props = $props();
</script>

{#if link !== ""}<div class=" min-w-[16px] flex items-center justify-center">
    <EllipsisMenu
      {tieKey}
      TriggerIcon={Music}
      note={event}
      iconSize={16}
      iconClass="text-zinc-500"
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
      {event.content ?? "link"}
    </div></a
  >
{:else if event.content.trim() !== ""}<div
    class=" min-w-[16px] flex items-center justify-center"
  >
    <EllipsisMenu
      {tieKey}
      TriggerIcon={Music}
      note={event}
      iconSize={16}
      iconClass="text-zinc-500 "
    />
  </div>
  <!-- <Music class=" min-w-[16px] h-[16px] w-[16px]" /> -->
  <!--  title={event.content.trim() !== "" ? event.content.trim() : "link"}タイトルにフル文章入れようかと思ったけどリンクとごっちゃになるからやめよう-->
  <div
    class="truncate line-clamp-2 max-w-full"
    style="	white-space: pre-wrap; word-break: break-word;"
  >
    {event.content.trim() !== "" ? event.content.trim() : "link"}
  </div>
{/if}

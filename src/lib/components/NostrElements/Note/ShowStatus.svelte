<script lang="ts">
  import { Music, TrendingUp } from "lucide-svelte";
  import StatusGeneral from "../../NostrMainData/StatusGeneral.svelte";

  import EllipsisMenu from "./NoteActionButtuns/EllipsisMenu.svelte";
  import { beforeNavigate } from "$app/navigation";
  import StatusMusic from "$lib/components/NostrMainData/StatusMusic.svelte";

  export let pubkey: string;
  export let tieKey: string | undefined;
  beforeNavigate((navigate) => {
    console.log("beforeNavigate", navigate.type);
    pubkey = "";
  });
</script>

{#if pubkey}
  <div class="text-sm text-zinc-500">
    <StatusGeneral {pubkey} let:event>
      {@const link = event.tags.find((tag) => tag[0] === "r")?.[1] ?? ""}
      <div class="flex gap-1 items-center">
        {#if link !== ""}
          <div class=" min-w-[16px] flex items-center justify-center">
            <EllipsisMenu
              TriggerIcon={TrendingUp}
              note={event}
              iconSize={16}
              iconClass="text-zinc-500"
              {tieKey}
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
              {event.content.trim() !== "" ? event.content.trim() : "link"}
            </div></a
          >
        {:else if event.content.trim() !== ""}
          <div class=" min-w-[16px] flex items-center justify-center">
            <EllipsisMenu
              {tieKey}
              TriggerIcon={TrendingUp}
              note={event}
              iconSize={16}
              iconClass="text-zinc-500"
            />
          </div>
          <div
            class="truncate line-clamp-2 max-w-full"
            style="	white-space: pre-wrap; word-break: break-word;"
          >
            {event.content}
          </div>
        {/if}
      </div>
    </StatusGeneral>
    <StatusMusic {pubkey} let:event>
      {@const link = event.tags.find((tag) => tag[0] === "r")?.[1] ?? ""}
      <div class="flex gap-1 items-center">
        {#if link !== ""}<div
            class=" min-w-[16px] flex items-center justify-center"
          >
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
      </div>
    </StatusMusic>
  </div>
{/if}

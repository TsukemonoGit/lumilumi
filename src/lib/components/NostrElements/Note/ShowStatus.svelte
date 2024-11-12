<script lang="ts">
  import { Music, TrendingUp } from "lucide-svelte";
  import StatusGeneral from "../../NostrMainData/StatusGeneral.svelte";

  import EllipsisMenu from "./NoteActionButtuns/EllipsisMenu.svelte";
  import { beforeNavigate } from "$app/navigation";
  import StatusMusic from "$lib/components/NostrMainData/StatusMusic.svelte";
  import DisplayName from "$lib/components/Elements/DisplayName.svelte";
  import * as Nostr from "nostr-typedef";
  import { hexRegex, nip33Regex, parseNaddr } from "$lib/func/util";
  import { nip19 } from "nostr-tools";
  import { page } from "$app/stores";

  export let pubkey: string | undefined;
  export let tieKey: string | undefined;
  beforeNavigate((navigate) => {
    //console.log("beforeNavigate", navigate.type);
    if (navigate.type !== "form") {
      pubkey = undefined;
    }
  });

  function getLink(event: Nostr.Event): string | undefined {
    //userURL
    const raeTags = event.tags.find(
      (tag) => tag[0] === "r" || tag[0] === "e" || tag[0] === "a"
    );
    if (raeTags && raeTags.length >= 2) {
      if (raeTags[0] === "r") {
        return raeTags[1];
      } else if (raeTags[0] === "e" && hexRegex.test(raeTags[1])) {
        return `${$page.url.origin}/${nip19.noteEncode(raeTags[1])}`;
      } else if (raeTags[0] === "a" && nip33Regex.test(raeTags[1])) {
        return `${$page.url.origin}/${nip19.naddrEncode(parseNaddr(raeTags))}`;
      }
    }
  }
</script>

{#if pubkey}
  <div class="text-sm text-zinc-500">
    <StatusGeneral {pubkey} let:event>
      {@const link = getLink(event)}
      <div class="flex gap-1 items-center">
        {#if link && link !== ""}
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
              <DisplayName
                height={20}
                name={event.content || link}
                tags={event.tags}
              />
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
            <DisplayName height={20} name={event.content} tags={event.tags} />
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

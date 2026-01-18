<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import Reaction from "./Reaction.svelte";

  import NoteActionButtons from "./NoteActionButtuns/NoteActionButtons.svelte";
  import Link from "$lib/components/Elements/Link.svelte";

  import { isvalidURL } from "$lib/func/ogp";

  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserPopupMenu from "../user/UserPopupMenu.svelte";
  import ProfileDisplay from "./EventCard/ProfileDisplay.svelte";
  import RepostComponent from "./layout/RepostComponent.svelte";
  import MediaEmbedSwitcher from "../content/MediaEmbedSwitcher.svelte";

  interface Props {
    note: Nostr.Event;
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;
    repostable: boolean;
  }
  let { note, metadata, displayMenu, depth, repostable }: Props = $props();
  let deleted = $state(false);

  // iタグを全件取得
  let iTags = $derived(
    (note?.tags || []).filter((tag) => tag[0] === "i" && tag.length > 2)
  );

  // rタグを全件取得
  let rTags = $derived(
    (note?.tags || []).filter((tag) => tag[0] === "r" && tag.length > 1)
  );

  // 表示用配列。iタグがあればそれを使い、なければrタグ
  let websiteTags = $derived(
    iTags.length > 0 ? iTags.map((tag) => tag[2]) : rTags.map((tag) => tag[1])
  );
</script>

{#if deleted}
  <div class="italic text-neutral-500 px-1">Deleted Note</div>
{:else if note}
  <RepostComponent>
    {#snippet kindIcon()}
      <div class="w-fit min-w-[20px] max-w-[40%]">
        <Reaction event={note} />
      </div>
    {/snippet}
    {#snippet userIcon()}
      <UserPopupMenu
        pubkey={note?.pubkey || ""}
        {metadata}
        size={20}
        {displayMenu}
        {depth}
      />
    {/snippet}
    {#snippet name()}
      <ProfileDisplay pubkey={note?.pubkey || ""} {metadata} />
    {/snippet}

    {#snippet actionButtons()}
      {#if displayMenu}
        <NoteActionButtons {note} {repostable} bind:deleted />
      {/if}
    {/snippet}
  </RepostComponent>

  <!-- 複数URLを順に表示 -->
  {#each websiteTags as url}
    <div class="p-2">
      {#if lumiSetting.get().showImg && isvalidURL(url)}
        <MediaEmbedSwitcher {url} author={note?.pubkey || ""} />
      {:else}
        <Link className="underline text-magnum-300 break-all" href={url}>
          {url}
        </Link>
      {/if}
    </div>
  {/each}
{/if}

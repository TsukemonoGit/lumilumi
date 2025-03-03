<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import Reaction from "./Reaction.svelte";

  import { profile } from "$lib/func/util";
  import { nip19 } from "nostr-tools";

  import NoteActionButtons from "./NoteActionButtuns/NoteActionButtons.svelte";
  import Link from "$lib/components/Elements/Link.svelte";

  import { isvalidURL } from "$lib/func/ogp";
  import OGP from "$lib/components/renderSnippets/OGP.svelte";
  import OgpCard from "$lib/components/Elements/OgpCard.svelte";
  import DisplayName from "$lib/components/NostrElements/user/DisplayName.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserPopupMenu from "../user/UserPopupMenu.svelte";

  interface Props {
    note: Nostr.Event;
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;
    tieKey: string | undefined;
  }
  let { note, metadata, displayMenu, tieKey, depth }: Props = $props();
  let deleted = $state(false);
  let website = $derived(reactionWebsite(note));
  function reactionWebsite(note: Nostr.Event): string | undefined {
    const webTag = note.tags.find((tag) => tag[0] === "r");
    if (webTag && webTag.length > 1) {
      return webTag[1];
    } else {
      return undefined;
    }
  }
  let prof = $derived(profile(metadata));
</script>

{#if deleted}
  <div class="italic text-neutral-500 px-1">Deleted Note</div>
{:else if note}
  <div class="flex gap-1 items-center bg-magnum-800/25">
    <div class="w-fit max-w-[40%]"><Reaction event={note} /></div>
    <div class="self-center">
      <UserPopupMenu
        pubkey={note.pubkey}
        {metadata}
        size={20}
        {displayMenu}
        {depth}
        {tieKey}
      />
    </div>
    <div class="break-all break-words whitespace-pre-line">
      {#if metadata}
        <DisplayName
          height={21}
          name={prof?.display_name ?? ""}
          tags={metadata.tags}
        />
        {#if prof && prof.name && prof.name !== ""}
          <span class="text-magnum-100 text-sm mt-auto"
            ><DisplayName
              height={21}
              name={`@${prof.name}`}
              tags={metadata.tags}
            /></span
          >{/if}
      {:else}
        <span class="text-magnum-100 text-sm"
          >@{nip19.npubEncode(note.pubkey)}</span
        >
      {/if}
    </div>

    <div class="ml-auto">
      {#if displayMenu}
        <NoteActionButtons
          {note}
          repostable={false}
          {tieKey}
          bind:deleted
        />{/if}
    </div>
  </div>
  <!--リアクションしたノートの情報（リポストのを使いまわし）-->

  {#if website}
    <div class="p-2">
      {#if lumiSetting.get().showImg && isvalidURL(website)}
        <OGP url={website}>
          {#snippet nodata()}
            <Link
              className="underline text-magnum-300 break-all "
              href={website}>{website}</Link
            >
          {/snippet}
          {#snippet renderContent(contents)}
            {#if contents.title !== "" || contents.image !== "" || contents.description !== ""}<!--OGP表示はTITLE必須にしておくと思ったけどそしたらXのOGPでてこなくなったから-->
              <OgpCard {contents} url={website} />
            {:else}
              <Link
                className="underline text-magnum-300 break-all "
                href={website}>{website}</Link
              >
            {/if}
          {/snippet}
        </OGP>
      {:else}
        <Link className="underline text-magnum-300 break-all " href={website}
          >{website}</Link
        >{/if}
    </div>
  {/if}
{/if}

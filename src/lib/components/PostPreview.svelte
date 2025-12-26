<script lang="ts">
  import { replyedEvent } from "$lib/func/event";
  import { lumiSetting, timelineFilter } from "$lib/stores/globalRunes.svelte";
  import {
    mutebykinds,
    mutes,
    queryClient,
    viewMediaModal,
  } from "$lib/stores/stores";
  import type { EventPacket } from "rx-nostr";
  import ProfileDisplay from "./NostrElements/kindEvents/EventCard/ProfileDisplay.svelte";
  import NoteComponent from "./NostrElements/kindEvents/layout/NoteComponent.svelte";
  import ReplyTo from "./NostrElements/kindEvents/layout/ReplyTo.svelte";
  import Reply from "./NostrElements/kindEvents/Reply.svelte";
  import ShowStatus from "./NostrElements/kindEvents/Status/ShowStatus.svelte";

  import UserPopupMenu from "./NostrElements/user/UserPopupMenu.svelte";

  import ChannelTag from "./NostrElements/content/ChannelTag.svelte";
  import { type Writable, writable } from "svelte/store";
  import Dialog from "./Elements/Dialog.svelte";
  import ContentParts from "./NostrElements/content/ContentParts.svelte";
  import Truncate from "./NostrElements/content/Truncate.svelte";
  import DecodedContent from "./NostrElements/kindEvents/DecodedContent.svelte";
  import UrlDisplay from "./NostrElements/content/UrlDisplay.svelte";
  import CustomEmoji from "./NostrElements/content/CustomEmoji.svelte";
  import Link from "./Elements/Link.svelte";
  import InvoiceCard from "./NostrElements/kindEvents/EventCard/InvoiceCard.svelte";
  import ClientTag from "./NostrElements/content/ClientTag.svelte";
  import Geohash from "./NostrElements/content/geohash/Geohash.svelte";
  import ProxyTag from "./NostrElements/content/ProxyTag.svelte";
  //import { type Part, parseText } from "$lib/func/content";
  import * as nip19 from "nostr-tools/nip19";
  import { untrack } from "svelte";
  import * as Nostr from "nostr-typedef";
  import {
    parseContent,
    TokenType,
    type Token,
  } from "@konemono/nostr-content-parser";
  import { nipLink } from "$lib/func/util";
  import { muteCheck } from "$lib/func/muteCheck";
  import { EyeOff, Shield } from "lucide-svelte";
  import PopupUserName from "./NostrElements/user/PopupUserName.svelte";
  import Protected from "./Elements/Protected.svelte";
  import Muted from "./Elements/Muted.svelte";

  // Props definition
  interface Props {
    event: Partial<Nostr.Event>;
    onWarning: boolean;
    warningText: string;
    signPubkey: string | undefined;

    addUser: (usr: string | undefined) => void;
    replyUsers: string[];
  }

  // Initialize props
  let {
    event,
    onWarning,
    warningText,
    signPubkey,

    replyUsers,
    addUser,
  }: Props = $props();
  let text = $derived(event.content || "");
  let tags = $derived(event.tags || []);
  // Constants
  const displayMenu = false;
  const depth = 0;

  const repostable = false;
  const zIndex = 100;
  const maxHeight = undefined;

  // State
  let parts: Token[] = $derived(
    parseContent(text, tags, { hashtagsFromTagsOnly: false })
  );
  let showMore: Writable<boolean> = $state(writable(false));

  // Computed values
  let metadata = $derived(
    signPubkey
      ? (
          queryClient?.getQueryData([
            "metadata",
            signPubkey,
          ]) as EventPacket | null
        )?.event
      : undefined
  );

  let replyTag = $derived.by(() => {
    if ([1, 42, 4, 1111].includes(event.kind || 1) && tags.length > 0) {
      return replyedEvent(tags, event.kind || 1).replyTag;
    }
    return undefined;
  });
  let isProtected = $derived(lumiSetting.get().protectedEvents);
  let mediaList = $derived(
    parts
      .filter((part) => part.type === "url")
      .map((p) => p.content)
      .filter((t) => t !== undefined)
  );

  let geohash = $derived(
    tags.find((tag) => tag[0] === "g" && tag.length > 1)?.[1]
  );

  let proxy = $derived(tags.find((item) => item[0] === "proxy"));

  // Effects
  $effect(() => {
    if (parts) {
      untrack(() => {
        parts
          .filter((part) => part.type === "nip19")
          .forEach((part) => {
            if (part.metadata?.plainNip19) {
              addUserTag(nip19Decode(part.metadata.plainNip19 as string));
            }
          });
      });
    }
  });

  // Helper functions
  const nip19Decode = (content: string | undefined) => {
    if (!content) return undefined;

    try {
      const decoded = nip19.decode(content);

      switch (decoded.type) {
        case "naddr":
          return {
            type: decoded.type,
            data: decoded.data as nip19.AddressPointer,
          };
        case "nevent":
          return {
            type: decoded.type,
            data: decoded.data as nip19.EventPointer,
          };
        case "nprofile":
          return {
            type: decoded.type,
            data: decoded.data as nip19.ProfilePointer,
          };
        case "nsec":
          return {
            type: decoded.type,
            data: decoded.data as Uint8Array,
          };
        default:
          return {
            type: decoded.type,
            data: decoded.data as string,
          };
      }
    } catch (error) {
      console.error("NIP-19 Decode Error:", error);
      return undefined;
    }
  };

  const addUserTag = (
    decode:
      | { type: "naddr"; data: nip19.AddressPointer }
      | { type: "nevent"; data: nip19.EventPointer }
      | { type: "nprofile"; data: nip19.ProfilePointer }
      | { type: "nsec"; data: Uint8Array }
      | { type: "npub" | "note"; data: string }
      | undefined
  ) => {
    if (!decode) return;

    switch (decode.type) {
      case "naddr":
      case "nprofile":
        addUser(decode.data.pubkey);
        break;
      case "nevent":
        addUser(decode.data.author);
        break;
      case "npub":
        addUser(decode.data);
        break;
      default:
        break;
    }
  };

  const onClickShowMore = () => {
    $showMore = true;
  };

  const openModal = (index: number) => {
    $viewMediaModal = {
      index: index,
      mediaList: $state.snapshot(mediaList),
    };
  };

  //ミュートメニューの設定は考慮しない
  let muteType = $derived.by(() => {
    if (!$mutes || (!$mutebykinds && !timelineFilter)) {
      return "null";
    }

    return muteCheck({ content: text, tags: tags, pubkey: signPubkey || "" });
  });
</script>

{#if lumiSetting.get().showPreview}
  <div class=" mb-4">
    <div
      class="p-2 pb-1 bg-neutral-900
     relative shadow-lg rounded-md min-h-[8.3rem]"
    >
      <div class="px-1 font-medium text-magnum-400">preview</div>

      <NoteComponent warningText={onWarning ? warningText : undefined}>
        {#snippet icon()}
          <!-- ミュート投稿のアイコン表示 -->
          {#if muteType !== "null"}
            <Muted {zIndex} />
          {/if}
          {#if isProtected}
            <Protected {zIndex} />
          {/if}
          {#if signPubkey}
            <UserPopupMenu
              pubkey={signPubkey}
              {metadata}
              size={40}
              displayMenu={true}
              depth={0}
              {zIndex}
            />{/if}
        {/snippet}

        {#snippet name()}
          {#if signPubkey}
            <ProfileDisplay pubkey={signPubkey} {metadata} />{/if}
        {/snippet}

        {#snippet status()}
          {#if lumiSetting.get().showUserStatus}<ShowStatus
              pubkey={signPubkey}
            />{/if}
        {/snippet}
        {#snippet replyUser()}
          {#if replyUsers.length > 0}
            <ReplyTo
              >{#each replyUsers as user}
                <PopupUserName pubkey={user} {zIndex} />
              {/each}</ReplyTo
            >{/if}
        {/snippet}
        {#snippet reply()}
          {#if replyTag || replyUsers.length > 0}
            <Reply
              {replyTag}
              {displayMenu}
              depth={depth + 1}
              {repostable}
              {zIndex}
            />
          {/if}
        {/snippet}
        {#snippet content()}<!--ここのしょりによってたぐにpが追加されたりするのか？pがないnostr:noteとかにpをつけるquoteUsers に入れて渡す-->

          <Truncate {maxHeight} {onClickShowMore} {depth}>
            {#each parts as part}{#if part.type === "nip19"}{@const decoded =
                  nip19Decode(part.metadata!.plainNip19 as string)}

                {#if decoded}
                  <DecodedContent
                    {maxHeight}
                    {decoded}
                    content={part.content}
                    tags={event.tags}
                    {displayMenu}
                    depth={depth + 1}
                    {repostable}
                    {zIndex}
                  />{:else}<span class="break-all">{part.content}</span>{/if}
              {:else if part.type === "url"}
                <UrlDisplay {part} {openModal} author={signPubkey || ""} />
              {:else if part.type === TokenType.CUSTOM_EMOJI}
                <CustomEmoji {part} />
              {:else if part.type === "hashtag"}
                <a
                  aria-label={"Search for events containing the hashtag"}
                  href={`/search?t=${part.metadata!.tag}`}
                  class="underline text-magnum-300 break-all">{part.content}</a
                >
              {:else if part.type === "relay"}
                <a
                  class="underline text-magnum-300 break-all"
                  href={part.content ?? ""}>{part.content}</a
                >
              {:else if part.type === TokenType.NIP_IDENTIFIER}
                <Link
                  props={{ "aria-label": `External Links: ${part.content}` }}
                  className="underline text-magnum-300 break-all hover:opacity-80"
                  href={nipLink((part.metadata!.number as string) ?? "")}
                  >{part.content}</Link
                >{:else if part.type === TokenType.LNBC && part.content}
                <InvoiceCard invoice={part.content} />
              {:else}<span
                  class="whitespace-pre-wrap break-words"
                  style="word-break: break-word;">{part.content}</span
                >{/if}{/each}
            <ClientTag {tags} isShowClientTag={true} {depth} />
            {#if geohash}
              <Geohash {geohash} />{/if}
            {#if proxy}
              <ProxyTag proxyTag={proxy} />
            {/if}
          </Truncate>
          {#if event.kind === 42}
            {@const heyaId = tags.find(
              (tag) => tag[0] === "e" && tag[3] === "root"
            )?.[1]}
            <ChannelTag {heyaId} />{/if}
        {/snippet}
      </NoteComponent>
    </div>
  </div>
{/if}

<Dialog id={"showMore_preview"} bind:open={showMore} zIndex={zIndex + 10}>
  {#snippet main()}
    <ContentParts
      {maxHeight}
      {event}
      {displayMenu}
      {depth}
      {repostable}
      zIndex={zIndex + 10}
    />
  {/snippet}</Dialog
>

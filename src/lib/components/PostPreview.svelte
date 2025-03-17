<script lang="ts">
  import { replyedEvent } from "$lib/func/event";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { queryClient, viewMediaModal } from "$lib/stores/stores";
  import type { EventPacket } from "rx-nostr";
  import Content from "./NostrElements/content/Content.svelte";
  import ProfileDisplay from "./NostrElements/kindEvents/EventCard/ProfileDisplay.svelte";
  import NoteComponent from "./NostrElements/kindEvents/layout/NoteComponent.svelte";
  import ReplyTo from "./NostrElements/kindEvents/layout/ReplyTo.svelte";
  import Reply from "./NostrElements/kindEvents/Reply.svelte";
  import ShowStatus from "./NostrElements/kindEvents/Status/ShowStatus.svelte";
  import UserName from "./NostrElements/user/UserName.svelte";
  import UserPopupMenu from "./NostrElements/user/UserPopupMenu.svelte";
  import * as Nostr from "nostr-typedef";
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
  import { type Part, parseText } from "$lib/func/content";
  import { nip19 } from "nostr-tools";
  import { untrack } from "svelte";
  import type { DecodeResult } from "nostr-tools/nip19";

  interface Props {
    tags: string[][];
    text: string;
    onWarning: boolean;
    warningText: string;
    signPubkey: string | undefined;
    kind: number;
    addUsr: (usr: string | undefined) => void;
    replyUsers: string[];
  }
  let {
    tags,
    text,
    onWarning,
    warningText,
    signPubkey,
    kind,
    replyUsers,
    addUsr,
  }: Props = $props();
  const displayMenu = false;
  const mini = false;
  const depth = 0;
  const tieKey = undefined;
  const repostable = false;
  const zIndex = 50;
  const maxHeight = undefined;

  let metadata: Nostr.Event | undefined = $derived(
    signPubkey
      ? (
          queryClient?.getQueryData([
            "metadata",
            signPubkey,
          ]) as EventPacket | null
        )?.event
      : undefined
  );

  // Process reply tags
  let replyTag = $derived.by(() => {
    if ([1, 42, 4, 1111].includes(kind) && tags.length > 0) {
      const res = replyedEvent(tags, kind);

      return res.replyTag;
    }
    return undefined;
  });

  // svelte-ignore non_reactive_update
  let showMore: Writable<boolean> = writable(false);

  const onClickShowMore = () => {
    console.log("showMore");
    $showMore = true;
  };

  let parts: Part[] = $state([]);
  //プレビューにも使ってるからconstだとだめ
  $effect(() => {
    if (text || tags) {
      untrack(async () => {
        parts = await parseText(text, tags);
      });
    }
  });

  let mediaList = $derived(
    parts
      .filter((part) => part.type === "url")
      .map((p) => p.url)
      .filter((t) => t !== undefined)
  );

  const openModal = (index: number) => {
    $viewMediaModal = { index: index, mediaList: $state.snapshot(mediaList) };
    console.log(index, $state.snapshot(mediaList));
  };

  const nip19Decode = (
    content: string | undefined
  ):
    | { type: "naddr"; data: nip19.AddressPointer }
    | { type: "nevent"; data: nip19.EventPointer }
    | { type: "nprofile"; data: nip19.ProfilePointer }
    | { type: "note" | "npub"; data: string }
    | { type: "nsec"; data: Uint8Array }
    | undefined => {
    if (content === undefined) {
      return undefined;
    }
    console.log("content", content);
    try {
      const decoded: nip19.DecodeResult = nip19.decode(content);

      if (decoded.type === "naddr") {
        return {
          type: decoded.type,
          data: decoded.data as nip19.AddressPointer,
        };
      } else if (decoded.type === "nevent") {
        return { type: decoded.type, data: decoded.data as nip19.EventPointer };
      } else if (decoded.type === "nprofile") {
        return {
          type: decoded.type,
          data: decoded.data as nip19.ProfilePointer,
        };
      } else if (decoded.type === "nsec") {
        return { type: decoded.type, data: decoded.data as Uint8Array };
      } else {
        return { type: decoded.type, data: decoded.data as string };
      }
    } catch (error) {
      console.error("NIP-19 Decode Error:", error); // Log the error
      return undefined;
    }
  };

  let geohash = $derived(
    tags.find((tag) => tag[0] === "g" && tag.length > 1)?.[1]
  ); // string | undefined
  let proxy = $derived(tags.find((item) => item[0] === "proxy")); // string[] | undefined
  $effect(() => {
    if (parts) {
      untrack(() => {
        parts
          .filter((part) => part.type === "nip19")
          .map((part) => addUserTag(nip19Decode(part.url)));
      });
    }
  });
  const addUserTag = (decode: DecodeResult | undefined) => {
    if (!decode) return;
    if (decode.type === "naddr" || decode.type === "nprofile") {
      addUsr(decode.data.pubkey);
    } else if (decode.type === "nevent") {
      addUsr(decode.data.author);
    } else if (decode.type === "npub") {
      addUsr(decode.data);
    }
  };
</script>

{#if signPubkey}<NoteComponent
    warningText={onWarning ? warningText : undefined}
  >
    {#snippet icon()}
      <UserPopupMenu
        pubkey={signPubkey || ""}
        {metadata}
        size={40}
        displayMenu={false}
        depth={0}
        tieKey={undefined}
      />
    {/snippet}

    {#snippet name()}
      <ProfileDisplay pubkey={signPubkey || ""} {metadata} />
    {/snippet}

    {#snippet status()}
      {#if lumiSetting.get().showUserStatus}<ShowStatus
          pubkey={signPubkey}
          tieKey={undefined}
        />{/if}
    {/snippet}
    {#snippet replyUser()}
      {#if replyUsers.length > 0}
        <ReplyTo
          >{#each replyUsers as user}
            <UserName pubhex={user} />
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
          {tieKey}
        />
      {/if}
    {/snippet}
    {#snippet content()}<!--ここのしょりによってたぐにpが追加されたりするのか？pがないnostr:noteとかにpをつけるquoteUsers に入れて渡す-->

      <Truncate {maxHeight} {onClickShowMore} {depth}>
        {#each parts as part}{#if part.type === "nip19"}{@const decoded =
              nip19Decode(part.url)}

            {#if decoded}
              <DecodedContent
                {maxHeight}
                {decoded}
                content={part.content}
                {displayMenu}
                depth={depth + 1}
                {repostable}
                {tieKey}
                {zIndex}
              />{:else}<span class="break-all">{part.content}</span>{/if}
          {:else if part.type === "url"}
            <UrlDisplay {part} {openModal} />
          {:else if part.type === "emoji"}
            <CustomEmoji {part} />
          {:else if part.type === "hashtag"}
            <a
              aria-label={"Search for events containing the hashtag"}
              href={`/search?t=${part.url}`}
              class="underline text-magnum-300 break-all">#{part.content}</a
            >
          {:else if part.type === "relay"}
            <a class="underline text-magnum-300 break-all" href={part.url ?? ""}
              >{part.content}</a
            >
          {:else if part.type === "nip"}
            <Link
              props={{ "aria-label": `External Links: ${part.url}` }}
              className="underline text-magnum-300 break-all hover:opacity-80"
              href={part.url ?? ""}>{part.content}</Link
            >{:else if part.type === "invoice" && part.content}
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
      {#if kind === 42}
        {@const heyaId = tags.find(
          (tag) => tag[0] === "e" && tag[3] === "root"
        )?.[1]}
        <ChannelTag {heyaId} {tieKey} />{/if}
    {/snippet}
  </NoteComponent>
{/if}

<Dialog bind:open={showMore} zIndex={zIndex + 10}>
  {#snippet main()}
    <div class=" rounded-md p-2 bg-zinc-800/40 w-full overflow-x-hidden">
      <ContentParts
        {maxHeight}
        {text}
        {tags}
        {displayMenu}
        {depth}
        {repostable}
        {tieKey}
        {zIndex}
      />
    </div>
  {/snippet}</Dialog
>

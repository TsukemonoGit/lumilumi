<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { Repeat2 } from "lucide-svelte";

  import OgpCard from "$lib/components/Elements/OgpCard.svelte";
  import OGP from "$lib/components/Elements/OGP.svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import ProxyTag from "$lib/components/Elements/ProxyTag.svelte";
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  import WarningHide2 from "$lib/components/Elements/WarningHide2.svelte";
  import ChannelMetadataLayout from "$lib/components/NostrElements/Note/ChannelMetadataLayout.svelte";
  import Content from "$lib/components/NostrElements/Note/Content.svelte";
  import Kind0Note from "$lib/components/NostrElements/Note/Kind0Note.svelte";
  import Kind30030Note from "$lib/components/NostrElements/Note/Kind30030Note.svelte";
  import Kind42Note from "$lib/components/NostrElements/Note/Kind42Note.svelte";
  import Kind9735Note from "$lib/components/NostrElements/Note/Kind9735Note.svelte";
  import ListLinkCard from "$lib/components/NostrElements/Note/ListLinkCard.svelte";
  import NoteActionButtons from "$lib/components/NostrElements/Note/NoteActionButtuns/NoteActionButtons.svelte";
  import NoteTemplate from "$lib/components/NostrElements/Note/NoteTemplate.svelte";
  import ReactionWebsite from "$lib/components/NostrElements/Note/ReactionWebsite.svelte";
  import ReplyThread from "$lib/components/NostrElements/Note/ReplyThread.svelte";
  import RepostedNote from "$lib/components/NostrElements/Note/RepostedNote.svelte";
  import ShowStatus from "$lib/components/NostrElements/Note/ShowStatus.svelte";
  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";
  import { getRelaysById } from "$lib/func/nostr";
  import { nip33Regex, profile } from "$lib/func/util";
  import {
    viewEventIds,
    loginUser,
    showUserStatus,
    showImg,
  } from "$lib/stores/stores";
  import { nip19 } from "nostr-tools";
  import { onDestroy } from "svelte";
  import { muteCheck } from "$lib/func/muteCheck";
  import Reply from "$lib/components/NostrElements/Note/Reply.svelte";
  import Reaction from "$lib/components/NostrElements/Note/Reaction.svelte";

  export let note: Nostr.Event;
  export let metadata: Nostr.Event | undefined = undefined;
  export let status: string | undefined = undefined;
  export let mini: boolean = false;
  const bech32Pattern = /<bech32>/;
  let currentNoteId: string | undefined = undefined;
  export let displayMenu: boolean = true;
  export let maxHeight: string = "16rem";
  export let thread: boolean = false;
  export let depth: number = 0;
  export let viewMuteEvent = false;
  export let excludefunc = (event: Nostr.Event) => false;
  $: paramNoteId = $page.params.note
    ? getIDbyParam($page.params.note)
    : undefined;

  function getIDbyParam(str: string) {
    const { type, data } = nip19.decode(str);
    if (type === "note") {
      return data as string;
    } else if (type === "nevent") {
      return data.id;
    } else {
      console.log(data);
    }
  }

  // $: replaceable =
  //   (note.kind >= 30000 && note.kind < 40000) ||
  //   (note.kind >= 10000 && note.kind < 20000);

  $: muteType =
    paramNoteId === note.id || excludefunc(note) ? "null" : muteCheck(note);
  $: if (note && note.id !== currentNoteId) {
    $viewEventIds = $viewEventIds.filter((item) => item !== currentNoteId);
    if (!$viewEventIds.includes(note.id)) {
      $viewEventIds.push(note.id);
    }
    currentNoteId = note.id;
  }

  onDestroy(() => {
    $viewEventIds = $viewEventIds.filter((item: string) => item !== note.id);
  });

  //eかa
  const repostedId = (
    tags: string[][]
  ): { tag: string[] | undefined; kind: number | undefined } => {
    const kindtag = tags.find((tag) => tag[0] === "k");
    const kind = kindtag ? Number(kindtag[1]) : undefined;
    return {
      tag: tags
        .slice()
        .reverse()
        .find((tag) => tag[0] === "e" || tag[0] === "a"),
      kind: kind,
    };
  };

  const baseClass = " overflow-hidden ";
  const noteClass = () => {
    const ptag = note.tags.filter((tag) => tag[0] === "p");
    const user = ptag.find((tag) => tag[1] === $loginUser);
    // let ret = `${baseClass} ${user ? " bg-magnum-700/20" : "border-magnum-600/30"}`;
    // return depth === 0
    //   ? `border-magnum-600 ${ret}`
    //   : `border-magnum-900 ${ret}`;
    return user ? ` bg-magnum-700/10 ${baseClass}` : `${baseClass}`; //border-l-2 border-magnum-700 //bg-magnum-700/10
  };

  const replyedEvent = (
    tags: string[][]
  ): { replyID: string | undefined; replyUsers: string[] } => {
    const users = tags.reduce((acc, [tag, value]) => {
      if (tag === "p") {
        return [...acc, value];
      } else {
        return acc;
      }
    }, []);
    const IDs = tags?.filter((tag) => tag[0] === "e");
    const root = IDs?.find((item) => item.length > 3 && item[3] === "root");
    const reply = IDs?.find((item) => item.length > 3 && item[3] === "reply");
    //  console.log(root?.[1]);
    return {
      replyUsers: users,
      replyID: reply
        ? reply[1]
        : root
          ? root[1]
          : IDs.length > 0
            ? IDs[IDs.length - 1][1]
            : undefined,
    };
  };

  const checkContentWarning = (tags: string[][]): string[] | undefined => {
    return tags.find((item) => item[0] === "content-warning");
  };

  const checkProxy = (tags: string[][]): string[] | undefined => {
    return tags.find((item) => item[0] === "proxy");
  };

  const findClientTag = (
    note: Nostr.Event
  ):
    | {
        name: string;
        aTag: string;
        filter: Nostr.Filter;
        naddr: string | undefined;
      }
    | undefined => {
    const clientTag = note.tags.find((item) => item[0] === "client");
    if (!clientTag) {
      return undefined;
    }
    const matches = clientTag[2]?.match(nip33Regex);
    if (!matches) {
      return undefined;
    }
    const filter: Nostr.Filter = {
      kinds: [Number(matches[1])],
      authors: [matches[2]],
      "#d": [matches[3]],
      limit: 1,
    };

    const dtag = note.tags.find((tag) => tag[0] === "d");
    const naddrAddress: nip19.AddressPointer = {
      identifier: dtag?.[1] ?? "",
      kind: note.kind,
      pubkey: note.pubkey,
      relays: getRelaysById(note.id),
    };
    try {
      return {
        name: clientTag[1],
        aTag: clientTag[2],
        filter: filter,
        naddr: nip19.naddrEncode(naddrAddress),
      };
    } catch (error) {
      return {
        name: clientTag[1],
        aTag: clientTag[2],
        filter: filter,
        naddr: undefined,
      };
    }
  };

  const findWebURL = (
    tags: string[][],
    clientData: {
      name: string;
      aTag: string;
      filter: Nostr.Filter;
      naddr: string | undefined;
    }
  ): string[] => {
    if (!clientData.naddr) return [];
    const webTag = tags.reduce((acc, [tag, url, nip19]) => {
      if (tag === "web" && nip19 === "naddr") {
        return [...acc, url];
      } else {
        return acc;
      }
    }, []);

    if (webTag.length == 0) {
      return [];
    }
    return webTag.map((item) => {
      return item.replace(bech32Pattern, clientData.naddr ?? "");
    });
  };
  $: proxy = checkProxy(note.tags);
  $: warning = checkContentWarning(note.tags);
  // const { kind, tag } = repostedId(note.tags);
  let replyID: string | undefined;
  let replyUsers: string[];
  $: if (note && note.kind === 1 && note.tags.length > 0) {
    const res = replyedEvent(note.tags);
    replyID = res.replyID;
    replyUsers = res.replyUsers;
  } else {
    replyID = undefined;
    replyUsers = [];
  }
  $: title = note.tags.find((tag) => tag[0] === "title" && tag.length > 1)?.[1];
  $: description = note.tags.find(
    (tag) =>
      (tag[0] === "description" || tag[0] === "summary") && tag.length > 1
  )?.[1];
  $: image = note.tags.find((tag) => tag[0] === "image" && tag.length > 1)?.[1];
</script>

{#if muteType !== "null" && depth >= 1}
  <button
    class="rounded bg-magnum-700 hover:opacity-75 active:opacity-50 text-magnum-50"
    on:click={() => (viewMuteEvent = !viewMuteEvent)}
  >
    {viewMuteEvent ? "hide" : "view"} Mute:{muteType}
  </button>
{/if}
{#if muteType === "null" || viewMuteEvent}
  {#if thread && replyID}
    <div class="border-b border-magnum-600/30">
      <ReplyThread {replyID} {displayMenu} {depth} />
    </div>
  {/if}

  <article class="{noteClass()} w-full">
    <div class=" break-all overflow-x-hidden gap-4 p-1">
      <div class="flex gap-1 w-fit">
        {#if metadata}
          <div>
            <UserMenu
              pubkey={note.pubkey}
              bind:metadata
              size={20}
              {displayMenu}
              {depth}
            />
          </div>
          <div class="text-magnum-100 text-sm">
            @{profile(metadata)?.name}
          </div>
          <div class="text-neutral-300/50 text-sm">kind:{note.kind}</div>
        {/if}
      </div>
      <div class="grid grid-cols-[1fr_auto] w-full gap-1 mb-1">
        <div>
          <h2 class="text-lg font-bold text-magnum-400">
            {title ?? "notitle"}
          </h2>
          {#if description}
            <div class=" text-neutral-300/80">{description}</div>{/if}
        </div>
        {#if image && $showImg}
          <img
            src={image}
            alt=""
            class="max-w-16 object-contain max-h-16"
          />{/if}
      </div>
      <div class="rounded-md border border-magnum-400/50 mt-4 p-1">
        <Content text={note.content} tags={note.tags} {displayMenu} {depth} />
        {#if displayMenu}<NoteActionButtons {note} />{/if}
      </div>
    </div>
  </article>
{/if}

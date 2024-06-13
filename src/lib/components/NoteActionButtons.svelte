<script lang="ts">
  import {
    Repeat,
    Heart,
    MessageSquare,
    Ellipsis,
    X,
    SmilePlus,
    FileJson2,
    ExternalLink,
    SquareArrowOutUpRight,
    Earth,
    Plus,
  } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";

  import Popover from "./Elements/Popover.svelte";
  import DropdownMenu from "./Elements/DropdownMenu.svelte";
  import Dialog from "./Elements/Dialog.svelte";
  import { getRelaysById, publishEvent } from "$lib/func/nostr";
  import { nip19 } from "nostr-tools";

  import { reactions } from "$lib/stores/stores";
  import Metadata from "./NostrMainData/Metadata.svelte";
  import type { Profile } from "$lib/types";
  import { writable, type Writable } from "svelte/store";
  import punycode from "punycode/punycode.js";
  import Reaction from "./Reaction.svelte";
  export let note: Nostr.Event;
  export let openReplyWindow: boolean = false;
  export let metadata: Nostr.Event | undefined = undefined;
  let dialogOpen: any;
  const menuTexts = [
    { text: "View Json", icon: FileJson2 },
    { text: "Open in njump", icon: SquareArrowOutUpRight },
    { text: "Google Translate", icon: Earth },
  ];
  const handleSelectItem = (index: number) => {
    console.log(menuTexts[index]);
    switch (index) {
      case 0:
        //view json
        $dialogOpen = true;
        break;

      case 1:
        //open in njump
        const eventpointer: nip19.EventPointer = {
          id: note.id,
          relays: getRelaysById(note.id),
          author: note.pubkey,
          kind: note.kind,
        };
        const nevent = nip19.neventEncode(eventpointer);
        const url = `https://njump.me/${nevent}`;

        window.open(url, "_blank", "noreferrer");
        break;

      case 2:
        const translateUrl = `https://translate.google.com/?sl=auto&op=translate&text=${encodeURIComponent(note.content)}`;

        window.open(translateUrl, "_blank", "noreferrer");
        break;
    }
  };
  // let reaction = writable<string | null>(null);

  const handleClickReaction = () => {
    const tmp = "+";
    const ev: Nostr.EventParameters = {
      kind: 7,
      tags: [
        ["p", note.pubkey],
        ["e", note.id],
        ["k", note.kind.toString()],
      ],
      content: tmp,
    };
    publishEvent(ev);
  };

  //リアクションしてないやつだけリアクションしたかどうか監視する感じで
  //リアクションボタン押したあとTLが読み込まれるまで判定できない（？）
  // afterUpdate(() => {
  //   if ($queryClient && !$reaction) {
  //     const data = $queryClient.getQueryData(["reaction", note.id]);

  //     if (data) {
  //       const tmp = (data as EventPacket).event.content;
  //       if (tmp === "+") {
  //         reaction.set("🧡");
  //       } else if (tmp === "-") {
  //         reaction.set("👎️");
  //       } else {
  //         reaction.set(tmp);
  //       }
  //       console.log($reaction);
  //     }
  //   }
  // });
  // $: if ($reaction === null && $queryClient) {
  //   const data = $queryClient.getQueryData(["reaction", note.id]);

  //   if (data) {
  //     const tmp = (data as EventPacket).event.content;
  //     if (tmp === "+") {
  //       reaction.set("🧡");
  //     } else if (tmp === "-") {
  //       reaction.set("👎️");
  //     } else {
  //       reaction.set(tmp);
  //     }
  //     console.log($reaction);
  //   }
  // }

  let reactionData: Nostr.Event<number> | undefined;
  reactions.subscribe((store) => {
    reactionData = store.get(note.id);
  });
  let replyText: string;

  //https://translate.google.com/?sl=auto&op=translate&text={0}
  //https://www.deepl.com/translator?share=generic#auto/auto/{0}

  const metadataName = (ev: Nostr.Event): string => {
    try {
      const profile: Profile = JSON.parse(ev.content);
      if (profile.name) {
        return profile.name;
      } else {
        return "";
      }
    } catch (error) {
      return "";
    }
  };
  let allPtag: string[] = note.tags.reduce((acc, item) => {
    if (item[0] === "p" && !acc.includes(item[1]) && item[1] !== note.pubkey) {
      acc.push(item[1]);
    }
    return acc;
  }, []);

  let additionalReplyUsers: Writable<string[]> = writable([...allPtag] ?? []);

  const handleClickReplySend = () => {
    const replyUsersArray: string[][] = $additionalReplyUsers.map((user) => [
      "p",
      user,
    ]);
    const root = note.tags.find(
      (item) => item[0] === "e" && item.length > 2 && item[3] === "root"
    );
    const etag = root
      ? [root, ["e", note.id, getRelaysById(note.id)?.[0], "reply"]]
      : [["e", note.id, getRelaysById(note.id)?.[0], "root"]];
    const ev: Nostr.EventParameters = {
      content: replyText,
      tags: [["p", note.pubkey], ...replyUsersArray, ...etag],
      kind: 1,
    };
    publishEvent(ev);
    replyText = "";
    openReplyWindow = false;

    console.log(ev);
  };

  const regexSymbolWithCombiningMarks = /(\P{Mark})(\p{Mark}+)/gu;

  const countSymbolsIgnoringCombiningMarks = (string: string) => {
    const stripped = string.replace(
      regexSymbolWithCombiningMarks,
      ($0: any, symbol: any, combiningMarks: any) => {
        return symbol;
      }
    );

    return punycode.ucs2.decode(stripped).length;
  };

  let customReaction: string = "";
  let customReactionError: boolean = false;
  let customReactionErrorMessage: string = "";
  let open: boolean;
  const handleClickCustomReaction = () => {
    const textLen = countSymbolsIgnoringCombiningMarks(customReaction);

    if (textLen !== 1) {
      customReactionError = true;
      customReactionErrorMessage = "Reaction length must be 1";
      setTimeout(() => {
        customReactionError = false;
        customReactionErrorMessage = "";
      }, 3000);
      return;
    }

    const ev: Nostr.EventParameters = {
      kind: 7,
      tags: [
        ["p", note.pubkey],
        ["e", note.id],
        ["k", note.kind.toString()],
      ],
      content: customReaction,
    };
    publishEvent(ev);
    open = false;
    customReaction = "";
  };
</script>

<div>
  <div class="flex justify-between py-0.5 mr-2">
    {#if note.kind === 1}
      <!--リプライ-->
      <button on:click={() => (openReplyWindow = !openReplyWindow)}>
        <MessageSquare
          size="20"
          class="hover:opacity-75 active:opacity-50 text-magnum-500 {openReplyWindow
            ? 'fill-magnum-700'
            : ''}"
        />
      </button>
      <!--リポスト-->
      <Popover {note}>
        <Repeat size="20" />
      </Popover>
      <!--リアクション-->
      {#if reactionData === undefined}
        <button on:click={handleClickReaction}>
          <Heart
            size="20"
            class="hover:opacity-75 active:opacity-50 text-magnum-500"
          />
        </button>
      {:else}
        <Reaction event={reactionData} />
      {/if}
      <!--カスタムリアクション-->
      <Popover {note} bind:open>
        <SmilePlus size="20" />
        <div slot="popoverContent">
          <div class="flex gap-1">
            <input
              type="text"
              class="h-10 w-full rounded-md px-3 py-2 text-magnum-100 border
                   {customReactionError
                ? 'border-red-500'
                : 'border-neutral-900'}"
              bind:value={customReaction}
            />
            <button
              on:click={handleClickCustomReaction}
              class="flex items-center w-fit px-2 rounded-md bg-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
            >
              OK
            </button>
          </div>
          {#if customReactionError}
            <div class="text-red-500 text-sm mt-1">
              {customReactionErrorMessage}
            </div>
          {/if}
        </div>
      </Popover>
    {/if}
    <!--メニュー-->
    <DropdownMenu {menuTexts} {handleSelectItem}>
      <Ellipsis size="20" />
    </DropdownMenu>
  </div>

  <!--replyWindow-->
  {#if openReplyWindow}
    <div class="w-[100%] p-2">
      <div class="flex gap-1">
        <div class=" rounded-md bg-magnum-300 text-magnum-950 w-fit px-1">
          @<Metadata
            queryKey={["metadata", note.pubkey]}
            pubkey={note.pubkey}
            let:metadata
          >
            {metadataName(metadata)}
          </Metadata>
        </div>
        {#if allPtag}
          {#each allPtag as replyuser, index}
            <div
              class=" rounded-md {$additionalReplyUsers.includes(replyuser)
                ? 'bg-magnum-300'
                : 'bg-magnum-300/50'} text-magnum-950 w-fit px-1"
            >
              @<Metadata
                queryKey={["metadata", replyuser]}
                pubkey={replyuser}
                let:metadata
              >
                {metadataName(metadata)}
              </Metadata>
              {#if $additionalReplyUsers.includes(replyuser)}
                <button
                  class=" inline-flex h-6 w-6 appearance-none align-middle
                   rounded-full p-1 text-magnum-800
                  hover:bg-magnum-100 focus:shadow-magnum-400"
                  on:click={() => {
                    additionalReplyUsers.update((users) => {
                      users.splice(index, 1);
                      return users;
                    });
                  }}
                >
                  <X class="size-4" />
                </button>
              {:else}<button
                  class=" inline-flex h-6 w-6 appearance-none align-middle
               rounded-full p-1 text-magnum-800
              hover:bg-magnum-100 focus:shadow-magnum-400"
                  on:click={() => {
                    additionalReplyUsers.update((users) => {
                      users.push(replyuser);
                      return users;
                    });
                  }}
                >
                  <Plus class="size-4" />
                </button>{/if}
            </div>
          {/each}
        {/if}
      </div>
      <textarea
        rows="3"
        class="w-[100%] rounded-md bg-neutral-950 mt-1"
        bind:value={replyText}
      />

      <div class=" flex justify-end gap-4">
        <button
          class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
          on:click={() => {
            replyText = "";
            $additionalReplyUsers = [...allPtag];
          }}
        >
          Cancel
        </button>
        <button
          class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-magnum-100 px-4 font-medium leading-none text-magnum-900"
          on:click={handleClickReplySend}
        >
          Send
        </button>
      </div>
    </div>
  {/if}
</div>

<!--JSON no Dialog-->
<Dialog bind:open={dialogOpen}>
  <div slot="main">
    <h2 class="m-0 text-lg font-medium">EVENT JSON</h2>
    <div
      class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[30vh]"
    >
      {JSON.stringify(note, null, 2)}
    </div>
    {#if metadata}
      <h2 class="m-0 text-lg font-medium">METADATA</h2>
      <div
        class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[30vh]"
      >
        {JSON.stringify(metadata, null, 2)}
      </div>
    {/if}
    <h2 class="m-0 text-lg font-medium">Seen on</h2>
    {getRelaysById(note.id)}
  </div></Dialog
>

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

  export let note: Nostr.Event;
  export let openReplyWindow: boolean = false;

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
  let reaction = "";
  reactions.subscribe((store) => {
    const reactionData = store.get(note.id);
    if (reactionData) {
      const tmp = reactionData.content;
      if (tmp === "+") {
        reaction = "🧡";
      } else if (tmp === "-") {
        reaction = "👎️";
      } else {
        reaction = tmp;
      }
    } else {
      reaction = "";
    }
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
    // ここで ev を送信するロジックを追加します
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
      {#if !reaction || reaction === ""}
        <button on:click={handleClickReaction}>
          <Heart
            size="20"
            class="hover:opacity-75 active:opacity-50 text-magnum-500"
          />
        </button>
      {:else}
        <div>{reaction}</div>
      {/if}
      <!--カスタムリアクション-->
      <Popover {note}>
        <SmilePlus size="20" />
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
      class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[60vh]"
    >
      {JSON.stringify(note, null, 2)}
    </div>
    <h2 class="m-0 text-lg font-medium">Seen on</h2>
    {getRelaysById(note.id)}
  </div></Dialog
>

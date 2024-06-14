<script lang="ts">
  import { Repeat2, Heart, MessageSquare, X, Plus, Quote } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";

  import { getRelaysById, publishEvent } from "$lib/func/nostr";
  import { nip19 } from "nostr-tools";

  import { reactions, toastSettings } from "$lib/stores/stores";

  import type { Profile } from "$lib/types";
  import { writable, type Writable } from "svelte/store";

  import EllipsisMenu from "./EllipsisMenu.svelte";
  import CustomReaction from "./CustomReaction.svelte";
  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import Reaction from "../Reaction.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";

  export let note: Nostr.Event;
  export let openReplyWindow: boolean = false;
  export let metadata: Nostr.Event | undefined = undefined;

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

  const menuTexts = [
    { text: "Repost", icon: Repeat2, num: 0 },
    { text: "Quote", icon: Quote, num: 1 },
  ];

  const handleSelectItem = async (index: number) => {
    console.log(menuTexts[index].num);
    const eventpointer: nip19.EventPointer = {
      id: note.id,
      relays: getRelaysById(note.id),
      author: note.pubkey,
      kind: note.kind,
    };
    const nevent = nip19.neventEncode(eventpointer);
    switch (menuTexts[index].num) {
      case 0:
        //repost
        const ev: Nostr.EventParameters =
          note.kind === 1
            ? {
                kind: 6,
                tags: [
                  ["p", note.pubkey],
                  ["e", note.id],
                ],
                content: "",
              }
            : {
                kind: 16,
                tags: [
                  ["p", note.pubkey],
                  ["e", note.id],
                  ["k", note.kind.toString()],
                ],
                content: "",
              };
        publishEvent(ev);
        break;
      case 1:
        //Quote
        //あとで
        break;
    }
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
      <DropdownMenu {menuTexts} {handleSelectItem}>
        <Repeat2 size="20" />
      </DropdownMenu>
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
      <CustomReaction {note} />
    {/if}
    <!--メニュー-->
    <EllipsisMenu {note} profile={metadata} />
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

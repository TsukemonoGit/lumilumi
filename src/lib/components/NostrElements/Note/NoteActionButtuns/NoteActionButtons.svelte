<script lang="ts">
  import {
    Repeat2,
    Heart,
    MessageSquare,
    X,
    Plus,
    Quote,
    SmilePlus,
    Send,
    TriangleAlert,
  } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";

  import { getRelaysById, publishEvent } from "$lib/func/nostr";
  import { nip19 } from "nostr-tools";

  import type { Profile } from "$lib/types";
  import { writable, type Writable } from "svelte/store";

  import EllipsisMenu from "./EllipsisMenu.svelte";
  import CustomReaction from "./CustomReaction.svelte";
  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import Reaction from "../Reaction.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import Reposted from "$lib/components/NostrMainData/Reposted.svelte";
  import Reactioned from "$lib/components/NostrMainData/Reactioned.svelte";
  import { emojis, showImg } from "$lib/stores/stores";
  import { contentCheck } from "$lib/func/contentCheck";
  import { nip33Regex } from "$lib/func/util";

  export let note: Nostr.Event;

  let openReplyWindow: boolean = false;
  let openQuoteWindow: boolean = false;
  let tags: string[][] = [];
  let viewCustomEmojis: boolean = false;
  let customReaction: string = "";
  let cursorPosition: number = 0;

  let dtag: string[] | undefined;
  let atag: string | undefined;
  $: {
    if (
      (note.kind >= 10000 && note.kind < 20000) ||
      (note.kind >= 30000 && note.kind < 40000) ||
      note.kind === 0 ||
      note.kind === 3
    ) {
      //atag　で　りぽすと
      dtag = note.tags.find((tag) => tag[0] === "d");
      atag = `${note.kind}:${note.pubkey}:${dtag ? dtag[1] : ""}`;
    } else {
      dtag = undefined;
      atag = undefined;
    }
  }
  // let reaction = writable<string | null>(null);

  const handleClickReaction = () => {
    const tmp = "+";
    const ev: Nostr.EventParameters = {
      kind: 7,
      tags: atag
        ? [
            ["p", note.pubkey],
            ["a", atag],
            ["k", note.kind.toString()],
          ]
        : [
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

  //reply
  const handleClickReplySend = () => {
    const { text: checkedtext, tags: checkedTags } = contentCheck(
      replyText.trim(),
      tags
    );
    checkedTags.push(["p", note.pubkey]);
    const root = note.tags.find(
      (item) => item[0] === "e" && item.length > 2 && item[3] === "root"
    );
    if (root) {
      checkedTags.push(root);
    }
    const replyUsersArray: string[][] = $additionalReplyUsers.map((user) => [
      "p",
      user,
    ]);
    checkedTags.push(...replyUsersArray);

    if (atag) {
      checkedTags.push(["a", atag, getRelaysById(note.id)?.[0] ?? ""]);
    } else {
      if (root) {
        checkedTags.push([
          "e",
          note.id,
          getRelaysById(note.id)?.[0] ?? "",
          "reply",
        ]);
      } else {
        checkedTags.push([
          "e",
          note.id,
          getRelaysById(note.id)?.[0] ?? "",
          "root",
        ]);
      }
    }
    // let etag = root
    //   ? [root, ["e", note.id, getRelaysById(note.id)?.[0], "reply"]]
    //   : [["e", note.id, getRelaysById(note.id)?.[0], "root"]];

    if (onWarning) {
      checkedTags.push(["content-warning", warningText]);
    }

    const ev: Nostr.EventParameters = {
      content: checkedtext,
      tags: checkedTags,
      kind: 1,
    };
    publishEvent(ev);
    replyText = "";
    openReplyWindow = false;
    tags = [];
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
        let tags: string[][] = [["p", note.pubkey]];
        //replaceable
        if (atag) {
          tags.push(["a", atag]);
        } else {
          tags.push(["e", note.id]);
        }
        if (note.kind !== 1) {
          tags.push(["k", note.kind.toString()]);
        }
        const ev: Nostr.EventParameters =
          note.kind === 1
            ? {
                kind: 6,
                tags: tags,
                content: "",
              }
            : {
                kind: 16,
                tags: tags,
                content: "",
              };
        publishEvent(ev);

        break;
      case 1:
        //Quote
        replyText = atag
          ? `nostr:${encodeNaddr(atag, nevent)}`
          : ` nostr:${nevent} `;
        openReplyWindow = false;
        openQuoteWindow = true;

        break;
    }
  };
  function encodeNaddr(atag: string, nevent: string): string {
    const matches = atag.match(nip33Regex);
    if (!matches) {
      return nevent;
    }
    const naddrAddress: nip19.AddressPointer = {
      kind: Number(matches[1]),
      pubkey: matches[2],
      identifier: matches[3],
    };
    try {
      return nip19.naddrEncode(naddrAddress);
    } catch (error) {
      return nevent;
    }
  }
  const handleClickEmoji = (e: string[]) => {
    const emojiTag = ["emoji", ...e];
    if (!tags.some((tag) => tag[0] === "emoji" && tag[1] === e[0])) {
      tags.push(emojiTag);
    }
    // カーソル位置にテキストを挿入
    const emojiText = `:${e[0]}:`;
    replyText =
      replyText.slice(0, cursorPosition) +
      emojiText +
      replyText.slice(cursorPosition);
    cursorPosition += emojiText.length;
  };

  //quote
  let addusers = false;
  const handleClickQuoteSend = () => {
    if (addusers) {
      tags.push(["p", note.pubkey]);
    }

    let { text: checkedtext, tags: checkedTags } = contentCheck(
      replyText.trim(),
      tags
    );
    if (onWarning) {
      checkedTags.push(["content-warning", warningText]);
    }
    const ev: Nostr.EventParameters = {
      content: checkedtext,
      tags: checkedTags,
      kind: 1,
    };
    publishEvent(ev);
    replyText = "";
    openQuoteWindow = false;
    addusers = false;
    tags = [];
    console.log(ev);
  };

  let warningText = "";
  let onWarning: boolean;
  $: if (openQuoteWindow || openReplyWindow) {
    const warning = note.tags.find((item) => item[0] === "content-warning");
    if (warning) {
      warningText = warning[1];
      onWarning = true;
    } else {
      warningText = "";
      onWarning = false;
    }
  }
</script>

<div>
  <div class="flex justify-between py-0.5 mr-2">
    {#if note.kind !== 6 && note.kind !== 16 && note.kind !== 7}
      <!--リプライ-->
      <button
        on:click={() => {
          openReplyWindow = !openReplyWindow;
          replyText = "";
          if (openReplyWindow) {
            openQuoteWindow = false;
          }
        }}
      >
        <MessageSquare
          size="20"
          class="hover:opacity-75 active:opacity-50 text-magnum-500 {openReplyWindow
            ? 'fill-magnum-700'
            : ''}"
        />
      </button>
      <!--リポスト-->
      <Reposted id={note.id} let:event>
        <DropdownMenu slot="loading" {menuTexts} {handleSelectItem}>
          <Repeat2 size="20" />
        </DropdownMenu>
        <DropdownMenu slot="nodata" {menuTexts} {handleSelectItem}>
          <Repeat2 size="20" />
        </DropdownMenu>
        <DropdownMenu slot="error" {menuTexts} {handleSelectItem}>
          <Repeat2 size="20" />
        </DropdownMenu>
        <DropdownMenu {menuTexts} {handleSelectItem}>
          <Repeat2 size="20" class={event ? "text-magnum-200 " : ""} />
        </DropdownMenu>
      </Reposted>
      <!--リアクション-->
      <Reactioned id={note.id} let:event>
        <button slot="loading" on:click={handleClickReaction}>
          <Heart
            size="20"
            class="hover:opacity-75 active:opacity-50 text-magnum-500 mt-auto"
          />
        </button>

        <button slot="nodata" on:click={handleClickReaction}>
          <Heart
            size="20"
            class="hover:opacity-75 active:opacity-50 text-magnum-500"
          />
        </button>

        <button slot="error" on:click={handleClickReaction}>
          <Heart
            size="20"
            class="hover:opacity-75 active:opacity-50 text-magnum-500"
          />
        </button>

        {#if event === undefined}
          <button on:click={handleClickReaction}>
            <Heart
              size="20"
              class="hover:opacity-75 active:opacity-50 text-magnum-500"
            />
          </button>
        {:else}
          <div class=" max-w-[40%]"><Reaction {event} /></div>
        {/if}
      </Reactioned>
      <!--カスタムリアクション-->
      <CustomReaction {note} />
    {/if}
    <!--メニュー-->
    <EllipsisMenu {note} />
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

        <button
          class="ml-auto inline-flex h-6 w-6 appearance-none
                items-center justify-center rounded-full p-1 text-magnum-800
                hover:bg-magnum-100 focus:shadow-magnum-400"
          on:click={() => {
            openReplyWindow = false;
          }}
        >
          <X size="20" />
        </button>
      </div>
      <textarea
        rows="3"
        class="w-[100%] rounded-md bg-neutral-950 mt-1"
        bind:value={replyText}
      />
      {#if onWarning}
        <div class="flex">
          <div class="mt-auto mb-auto text-sm break-keep">理由：</div>
          <input
            type="text"
            class="px-1 h-8 w-full rounded-md text-magnum-100 border-2
           'border-neutral-900'}"
            bind:value={warningText}
          />
        </div>
      {:else}<div class="h-4" />{/if}
      <div class="mt-2 flex justify-between">
        <button
          on:click={() => {
            onWarning = !onWarning;
          }}
          class=" h-8 rounded-sm
            bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
        >
          <TriangleAlert
            size="20"
            class="stroke-magnum-300 {onWarning ? 'fill-magnum-700 ' : ''}"
          />
        </button>
        <div class=" flex justify-end gap-4">
          {#if $emojis && $emojis.length > 0}
            {#if viewCustomEmojis}
              <input
                type="text"
                class="h-8 w-full rounded-md text-magnum-100 border-2
           'border-neutral-900'}"
                bind:value={customReaction}
              />
            {/if}
            <button
              on:click={() => {
                viewCustomEmojis = !viewCustomEmojis;
              }}
              class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
            >
              <SmilePlus
                size="20"
                class={viewCustomEmojis ? "fill-magnum-700" : ""}
              />
            </button>
          {/if}

          <button
            class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-magnum-100 px-4 font-medium leading-none text-magnum-900"
            on:click={handleClickReplySend}
          >
            <Send size="20" />
          </button>
        </div>
      </div>

      {#if viewCustomEmojis}
        <div
          class="rounded-sm mt-2 border border-magnum-600 flex flex-wrap pt-2 max-h-48 overflow-y-auto"
        >
          {#each $emojis as e, index}
            {#if customReaction === "" || e[0]
                .toLowerCase()
                .includes(customReaction.toLowerCase())}
              <button
                on:click={() => handleClickEmoji(e)}
                class="rounded-md border m-0.5 p-2 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 text-sm"
              >
                {#if $showImg}
                  <img
                    loading="lazy"
                    class="h-4 object-contain justify-self-center"
                    src={e[1]}
                    alt={e[0]}
                  />{:else}{e[0]}{/if}
              </button>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!--quoteWindow-->
  {#if openQuoteWindow}
    <div class="w-[100%] p-2">
      <div class="flex gap-1">
        <div
          class=" rounded-md {addusers
            ? 'bg-magnum-300'
            : 'bg-magnum-300/50'} text-magnum-950 w-fit px-1"
        >
          @<Metadata
            queryKey={["metadata", note.pubkey]}
            pubkey={note.pubkey}
            let:metadata
          >
            {metadataName(metadata)}
          </Metadata>
          {#if addusers}
            <button
              class=" inline-flex h-6 w-6 appearance-none align-middle
                   rounded-full p-1 text-magnum-800
                  hover:bg-magnum-100 focus:shadow-magnum-400"
              on:click={() => {
                addusers = false;
              }}
            >
              <X class="size-4" />
            </button>
          {:else}<button
              class=" inline-flex h-6 w-6 appearance-none align-middle
               rounded-full p-1 text-magnum-800
              hover:bg-magnum-100 focus:shadow-magnum-400"
              on:click={() => {
                addusers = true;
              }}
            >
              <Plus class="size-4" />
            </button>{/if}
        </div>

        <button
          class="ml-auto inline-flex h-6 w-6 appearance-none
            items-center justify-center rounded-full p-1 text-magnum-800
            hover:bg-magnum-100 focus:shadow-magnum-400"
          on:click={() => {
            openQuoteWindow = false;
          }}
        >
          <X size="20" />
        </button>
      </div>

      <textarea
        rows="6"
        class="w-[100%] rounded-md bg-neutral-950 mt-1"
        bind:value={replyText}
      />
      {#if onWarning}
        <div class="flex">
          <div class="mt-auto mb-auto text-sm break-keep">理由：</div>
          <input
            type="text"
            class="px-1 h-8 w-full rounded-md text-magnum-100 border-2
         'border-neutral-900'}"
            bind:value={warningText}
          />
        </div>
      {:else}<div class="h-4" />{/if}
      <div class="mt-2 flex justify-between">
        <button
          on:click={() => {
            onWarning = !onWarning;
          }}
          class=" h-8 rounded-sm
          bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
        >
          <TriangleAlert
            size="20"
            class="stroke-magnum-300 {onWarning ? 'fill-magnum-700 ' : ''}"
          />
        </button>
        <div class=" flex justify-end gap-4">
          {#if $emojis && $emojis.length > 0}
            {#if viewCustomEmojis}
              <input
                type="text"
                class="h-8 w-full rounded-md text-magnum-100 border-2
           'border-neutral-900'}"
                bind:value={customReaction}
              />
            {/if}
            <button
              on:click={() => {
                viewCustomEmojis = !viewCustomEmojis;
              }}
              class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
            >
              <SmilePlus
                size="20"
                class={viewCustomEmojis ? "fill-magnum-700" : ""}
              />
            </button>
          {/if}

          <button
            class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-magnum-100 px-4 font-medium leading-none text-magnum-900"
            on:click={handleClickQuoteSend}
          >
            <Send size="20" />
          </button>
        </div>
      </div>
      {#if viewCustomEmojis}
        <div
          class="rounded-sm mt-2 border border-magnum-600 flex flex-wrap pt-2 max-h-48 overflow-y-auto"
        >
          {#each $emojis as e, index}
            {#if customReaction === "" || e[0]
                .toLowerCase()
                .includes(customReaction.toLowerCase())}
              <button
                on:click={() => handleClickEmoji(e)}
                class="rounded-md border m-0.5 p-2 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 text-sm"
              >
                {#if $showImg}
                  <img
                    loading="lazy"
                    class="h-4 object-contain justify-self-center"
                    src={e[1]}
                    alt={e[0]}
                  />{:else}{e[0]}{/if}
              </button>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

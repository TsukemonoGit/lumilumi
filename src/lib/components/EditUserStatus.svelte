<!--edituserstatus.svelte-->
<script lang="ts">
  import { emojis, nowProgress, toastSettings } from "$lib/stores/stores";
  import { createDialog, melt } from "@melt-ui/svelte";
  import { SmilePlus, X } from "lucide-svelte";

  import { fade } from "svelte/transition";
  import * as Nostr from "nostr-typedef";

  import { publishEvent } from "$lib/func/nostr";
  import Popover from "./Elements/Popover.svelte";
  import { contentEmojiCheck } from "$lib/func/contentCheck";
  import { parseNaddr } from "$lib/func/util";
  import { hexRegex, nip33Regex } from "$lib/func/regex";
  import { nip19 } from "nostr-tools";
  import { nip07Signer } from "rx-nostr";
  import { lumiSetting, userStatusMap } from "$lib/stores/globalRunes.svelte";

  let { dialogOpen = $bindable() } = $props();

  let openPopover: (bool: boolean) => void = $state(() => {});
  const {
    elements: {
      trigger,
      overlay,
      content,
      title,
      description,
      close,
      portalled,
    },
    states: { open },
  } = createDialog({
    forceVisible: true,
  });
  dialogOpen?.subscribe((value: boolean) => {
    console.log(value);
    if (value) {
      $open = value;
      $dialogOpen = false;
    }
  });

  let userStatus: string = $state("");
  let userURL: string = $state("");
  //  $open = true;

  open.subscribe(async (value) => {
    // console.log(value);
    if (value && !$nowProgress) {
      $nowProgress = true;
      try {
        const pubkey = await (
          window.nostr as Nostr.Nip07.Nostr
        )?.getPublicKey();
        //throw Error("failed to get pubkey");
        if (!pubkey) {
          throw Error("failed to get pubkey");
        }
        // const statusEvent: EventPacket | undefined = $queryClient?.getQueryData(
        //   ["userStatus", "general", pubkey]
        // );
        const statusEvent: Nostr.Event | undefined = userStatusMap.get
          .get(pubkey)
          ?.get("general");
        console.log(statusEvent);

        if (statusEvent) {
          userStatus = statusEvent.content;
          //userURL
          const raeTags = statusEvent.tags.find(
            (tag) => tag[0] === "r" || tag[0] === "e" || tag[0] === "a"
          );
          if (raeTags && raeTags.length >= 2) {
            if (raeTags[0] === "r") {
              userURL = raeTags[1];
            } else if (raeTags[0] === "e" && hexRegex.test(raeTags[1])) {
              userURL = nip19.noteEncode(raeTags[1]);
            } else if (raeTags[0] === "a" && nip33Regex.test(raeTags[1])) {
              userURL = nip19.naddrEncode(parseNaddr(raeTags));
            }
            emojiTags = statusEvent.tags.filter(
              (tag) => tag[0] === "emoji" && tag.length >= 3
            );
          }
        }
        $nowProgress = false;
      } catch (error: any) {
        if (error?.message) {
          $toastSettings = {
            title: "Error",
            description: error.message,
            color: "bg-orange-500",
          };
        }
        $toastSettings = {
          title: "Error",
          description: "failed to get pubkey",
          color: "bg-orange-500",
        };
        $nowProgress = false;
      }
    }
  });

  const handleClickSave = async () => {
    $nowProgress = true;

    let tags = [["d", "general"]];
    if (userURL.trim() !== "") {
      const addTag = createNewAddTag(userURL.trim());
      if (addTag) {
        tags.push(addTag);
      }
    }
    if (emojiTags.length > 0) {
      tags = [...tags, ...emojiTags];
    }
    const newtags = contentEmojiCheck(userStatus, tags);
    const newStatus: Nostr.EventParameters = {
      kind: 30315,
      tags: newtags.tags,
      content: userStatus,
    };
    const signer = nip07Signer();
    try {
      const event = await signer.signEvent(newStatus);

      publishEvent(event);
      $toastSettings = {
        title: "Published",
        description: "",
        color: "bg-green-500",
      };
      emojiTags = [];
      $nowProgress = false;
      $open = false;
    } catch (error) {
      $toastSettings = {
        title: "Failed",
        description: "failed to publish",
        color: "bg-red-500",
      };
      emojiTags = [];
      $nowProgress = false;
      $open = false;
    }
  };

  let emojiTags: string[][] = [];
  const handleClickEmojiDisplayName = (e: string[]) => {
    openPopover?.(false);

    const emojiTag = ["emoji", ...e];
    if (!emojiTags.some((tag) => tag[0] === "emoji" && tag[1] === e[0])) {
      emojiTags.push(emojiTag);
    }
    const emojiText = `:${e[0]}:`;
    userStatus = userStatus + emojiText;
    // newProfile.display_name?.slice(0, cursorPosition) +
    // emojiText +
    // newProfile.display_name?.slice(cursorPosition);
    // cursorPosition += emojiText.length;
  };
  let customReaction: string = "";

  function createNewAddTag(str: string): string[] {
    const nip19Regex =
      /^(((npub|nsec|nprofile|naddr|nevent|note)1[023456789acdefghjklmnpqrstuvwxyz]{58,}))$/;
    if (nip19Regex.test(str)) {
      try {
        const { type, data } = nip19.decode(str);
        if (type === "naddr") {
          let tag = ["a", `${data.kind}:${data.pubkey}:${data.identifier}`];
          if (data.relays && data.relays[0] && data.relays[0] !== "") {
            tag = [...tag, data.relays[0]];
          }
          return tag;
        } else if (type === "note") {
          return ["e", data];
        } else if (type === "nevent") {
          let tag = ["e", data.id];
          if (data.relays && data.relays[0] && data.relays[0] !== "") {
            tag = [...tag, data.relays[0]];
          }
          return tag;
        } else if (type === "nprofile") {
          let tag = ["p", data.pubkey];
          if (data.relays && data.relays[0] && data.relays[0] !== "") {
            tag = [...tag, data.relays[0]];
          }
          return tag;
        } else if (type === "npub") {
          return ["p", data];
        } else {
          return ["r", str];
        }
      } catch (error) {
        return ["r", str];
      }
    } else {
      return ["r", str];
    }
  }
</script>

{#if $open}
  <div class="" use:melt={$portalled}>
    <div
      use:melt={$overlay}
      class="fixed inset-0 z-50 bg-black/50"
      transition:fade={{ duration: 150 }}
    ></div>
    <div
      class="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[90vw]
            max-w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-neutral-900
            p-6 shadow-lg"
      use:melt={$content}
    >
      <h2 use:melt={$title} class="m-0 text-lg font-medium text-magnum-300">
        Edit status
      </h2>
      <!-- <p use:melt={$description} class="mb-5 mt-2 leading-normal text-zinc-600">
        Make changes to your profile here. Click save when you're done.
      </p> -->

      <fieldset class="mb-4 mt-4 flex flex-col gap-2">
        <label class=" text-zinc-100" for="status"> Status </label>
        <input
          class="h-8 w-full
                    rounded-sm border border-solid px-1 leading-none text-zinc-100"
          id="status"
          type="text"
          bind:value={userStatus}
        />{#if $emojis && $emojis.list.length > 0}
          <div class=" w-fit flex self-end">
            <Popover bind:openPopover ariaLabel="custom emoji" zIndex={100}>
              <div class="actionButton">
                <SmilePlus size="20" />
              </div>
              {#snippet popoverContent()}
                <div>
                  <div
                    class="rounded-sm mt-2 border border-magnum-600 flex flex-wrap pt-2 max-h-40 overflow-y-auto"
                  >
                    {#each $emojis.list as e, index}
                      {#if customReaction === "" || e[0]
                          .toLowerCase()
                          .includes(customReaction.toLowerCase())}
                        <button
                          onclick={() => handleClickEmojiDisplayName(e)}
                          class="rounded-md border m-0.5 p-1 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 text-sm"
                        >
                          {#if lumiSetting.get().showImg}
                            <img
                              loading="lazy"
                              class="h-6 object-contain justify-self-center"
                              src={e[1]}
                              alt={e[0]}
                              title={e[0]}
                            />{:else}{e[0]}{/if}
                        </button>
                      {/if}
                    {/each}
                  </div>
                </div>
              {/snippet}
            </Popover>
          </div>
        {/if}
      </fieldset>

      <fieldset class="mb-4 flex flex-col items-start gap-2">
        <label class=" text-zinc-100" for="URL">URL or EventID (option)</label>
        <input
          class="h-8 w-full
                    rounded-sm border border-solid px-1 leading-none text-zinc-100"
          id="statusURL"
          type="url"
          bind:value={userURL}
          placeholder="https,note,npub,naddr,etc"
        />
      </fieldset>
      <div class="mt-6 flex justify-end gap-4">
        <button
          use:melt={$close}
          class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
        >
          Cancel
        </button>
        <button
          onclick={handleClickSave}
          class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-magnum-100 px-4 font-medium leading-none text-magnum-900"
        >
          Save changes
        </button>
      </div>
      <button
        use:melt={$close}
        aria-label="close"
        class="absolute right-4 top-4 inline-flex h-6 w-6 appearance-none
                items-center justify-center rounded-full p-1 text-magnum-800
                hover:bg-magnum-100 focus:shadow-magnum-400"
      >
        <X class="size-4" />
      </button>
    </div>
  </div>
{/if}

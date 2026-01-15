<!--edituserstatus.svelte-->
<script lang="ts">
  import { emojis, nowProgress } from "$lib/stores/stores";
  import { createDialog, melt } from "@melt-ui/svelte";

  import { fade } from "svelte/transition";
  import * as Nostr from "nostr-typedef";

  import { publishEvent } from "$lib/func/nostr";
  import { pruneEmojiTagsByText } from "$lib/func/contentCheck";
  import { parseNaddr } from "$lib/func/util";
  import { hexRegex, nip33Regex } from "$lib/func/regex";
  import * as nip19 from "nostr-tools/nip19";
  import { nip07Signer } from "rx-nostr";
  import { loginUser, userStatusMap } from "$lib/stores/globalRunes.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { collectEmojiTagsFromText } from "$lib/func/customEmoji";
  import CloseButton from "./Elements/CloseButton.svelte";
  import { addToast } from "./Elements/Toast.svelte";
  import EmojiPickerPopover from "./Elements/EmojiPickerPopover.svelte";

  let { dialogOpen = $bindable() } = $props();

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
    if (value) {
      $open = value;
      $dialogOpen = false;
    }
  });

  let userStatus: string = $state("");
  let userURL: string = $state("");
  let customReaction: string = $state("");

  open.subscribe(async (value) => {
    if (value && !$nowProgress) {
      $nowProgress = true;
      try {
        if (!loginUser.value) {
          const pubkey = await (
            window.nostr as Nostr.Nip07.Nostr
          )?.getPublicKey();
          if (pubkey) {
            loginUser.value = pubkey;
          }
          if (!pubkey) {
            throw Error("failed to get pubkey");
          }
        }
        const statusEvent: Nostr.Event | undefined = userStatusMap
          .get(loginUser.value)
          ?.get("general");

        if (statusEvent) {
          userStatus = statusEvent.content;
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
          }
        }
        $nowProgress = false;
      } catch (error: any) {
        if (error?.message) {
          addToast({
            data: {
              title: "Error",
              description: error.message,
              color: "bg-orange-500",
            },
          });
        }
        addToast({
          data: {
            title: "Error",
            description: "failed to get pubkey",
            color: "bg-orange-500",
          },
        });
        $nowProgress = false;
      }
      setTimeout(() => {
        statusInput?.setSelectionRange(userStatus.length, userStatus.length);
      }, 1);
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

    const emojitag: string[][] | undefined = await collectEmojiTagsFromText(
      tags,
      userStatus
    );

    const newtags = pruneEmojiTagsByText(userStatus, emojitag);

    const newStatus: Nostr.EventParameters = {
      kind: 30315,
      tags: newtags.tags,
      content: userStatus,
    };
    const signer = nip07Signer();
    try {
      const event = await signer.signEvent(newStatus);

      publishEvent(event);
      addToast({
        data: {
          title: "Published",
          description: "",
          color: "bg-green-500",
        },
      });

      $nowProgress = false;
      $open = false;
    } catch (error) {
      addToast({
        data: {
          title: "Failed",
          description: "failed to publish",
          color: "bg-red-500",
        },
      });

      $nowProgress = false;
      $open = false;
    }
  };

  let statusInput = $state<HTMLInputElement>();

  const handleEmojiSelect = (emojiContent: string, emojiTag?: string[]) => {
    const emojiText = emojiTag ? `:${emojiTag[0]}:` : emojiContent;
    const insertStart = statusInput?.selectionStart || 0;
    const insertEnd = insertStart + emojiText.length;

    userStatus =
      userStatus.slice(0, insertStart) +
      emojiText +
      userStatus.slice(insertStart);

    setTimeout(() => {
      statusInput?.focus();
      statusInput?.setSelectionRange(insertEnd, insertEnd);
    }, 0);
  };

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
        {$_("status.edit")}
      </h2>

      <fieldset class="mb-4 mt-4 flex flex-col gap-2">
        <label class=" text-zinc-100" for="status"> Status </label>
        <input
          bind:this={statusInput}
          class="h-8 w-full
                    rounded-sm border border-solid px-1 leading-none text-zinc-100"
          id="status"
          type="text"
          bind:value={userStatus}
        />
        {#if $emojis && $emojis.list.length > 0}
          <div class="w-fit flex self-end">
            <EmojiPickerPopover
              bind:customReaction
              onSelect={handleEmojiSelect}
              zIndex={60}
            />
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
      <CloseButton useMelt={$close} ariaLabel="close" />
    </div>
  </div>
{/if}

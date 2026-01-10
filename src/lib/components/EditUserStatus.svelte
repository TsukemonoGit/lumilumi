<!--edituserstatus.svelte-->
<script lang="ts">
  import { emojis, nowProgress } from "$lib/stores/stores";
  import Dialog from "./Elements/Dialog.svelte";

  import * as Nostr from "nostr-typedef";

  import { publishEvent } from "$lib/func/nostr";
  import { contentEmojiCheck } from "$lib/func/contentCheck";
  import { parseNaddr } from "$lib/func/util";
  import { hexRegex, nip33Regex } from "$lib/func/regex";
  import * as nip19 from "nostr-tools/nip19";
  import { nip07Signer } from "rx-nostr";
  import { loginUser, userStatusMap } from "$lib/stores/globalRunes.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { checkCustomEmojis } from "$lib/func/customEmoji";
  import InputCustomEmoji from "./InputCustomEmoji.svelte";
  import { addToast } from "./Elements/Toast.svelte";
  import { untrack } from "svelte";

  let { dialogOpen = $bindable(false) }: { dialogOpen?: boolean } = $props();

  let openPopover: (bool: boolean) => void = $state(() => {});

  let userStatus: string = $state("");
  let userURL: string = $state("");

  $effect(() => {
    if (dialogOpen) {
      untrack(() => {
        handleDialogOpen();
      });
    }
  });

  async function handleDialogOpen() {
    if ($nowProgress) return;
    $nowProgress = true;
    try {
      if (!loginUser.value) {
        const pubkey = await (
          window.nostr as Nostr.Nip07.Nostr
        )?.getPublicKey();
        if (pubkey) {
          loginUser.value = pubkey;
        }
        //throw Error("failed to get pubkey");
        if (!pubkey) {
          throw Error("failed to get pubkey");
        }
      }
      // const statusEvent: EventPacket | undefined = $queryClient?.getQueryData(
      //   ["userStatus", "general", pubkey]
      // );
      const statusEvent: Nostr.Event | undefined = userStatusMap

        .get(loginUser.value)
        ?.get("general");
      //console.log(statusEvent);

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
          /*    emojiTags = statusEvent.tags.filter(
            (tag) => tag[0] === "emoji" && tag.length >= 3
          ); */
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

  const handleClickSave = async () => {
    $nowProgress = true;

    let tags = [["d", "general"]];
    if (userURL.trim() !== "") {
      const addTag = createNewAddTag(userURL.trim());
      if (addTag) {
        tags.push(addTag);
      }
    }

    const emojitag: string[][] | undefined = await checkCustomEmojis(
      tags,
      userStatus
    );
    if (emojitag) {
      tags = [...tags, ...emojitag];
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
      addToast({
        data: {
          title: "Published",
          description: "",
          color: "bg-green-500",
        },
      });

      $nowProgress = false;
      dialogOpen = false;
    } catch (error) {
      addToast({
        data: {
          title: "Failed",
          description: "failed to publish",
          color: "bg-red-500",
        },
      });

      $nowProgress = false;
      dialogOpen = false;
    }
  };

  let statusInput = $state<HTMLInputElement>();

  const handleClickEmojiDisplayName = (e: string[]) => {
    openPopover?.(false);

    /*    const emojiTag = ["emoji", ...e];
    if (!emojiTags.some((tag) => tag[0] === "emoji" && tag[1] === e[0])) {
      emojiTags.push(emojiTag);
    } */
    const emojiText = `:${e[0]}:`;
    // userStatus = userStatus + emojiText;
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

<Dialog
  bind:open={dialogOpen}
  id="edit-user-status"
  zIndex={50}
  contentClass="max-w-[640px]"
>
  {#snippet title()}{$_("status.edit")}{/snippet}
  {#snippet main()}
    <fieldset class="mb-4 mt-4 flex flex-col gap-2">
      <label class=" text-zinc-100" for="status"> Status </label>
      <input
        bind:this={statusInput}
        class="h-8 w-full
                    rounded-sm border border-solid px-1 leading-none text-zinc-100"
        id="status"
        type="text"
        bind:value={userStatus}
      />{#if $emojis && $emojis.list.length > 0}
        <div class=" w-fit flex self-end">
          <InputCustomEmoji onClickEmoji={handleClickEmojiDisplayName} />
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
  {/snippet}

  {#snippet footer({ close })}
    <div class="mt-6 flex justify-end gap-4">
      <button
        onclick={close}
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
  {/snippet}
</Dialog>

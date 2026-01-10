<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";
  import { createDialog, melt } from "@melt-ui/svelte";
  import { fade } from "svelte/transition";
  import { SquarePen } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import { promisePublishSignedEvent } from "$lib/func/nostr";
  import {
    nowProgress,
    postWindowOpen,
    additionalPostOptions,
  } from "$lib/stores/stores";

  import type { DefaultPostOptions, MargePostOptions } from "$lib/types";
  import { nip07Signer } from "rx-nostr";
  import { loginUser, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import AlertDialog from "./Elements/AlertDialog.svelte";
  import CreatePost from "./CreatePost.svelte";
  import { contentCheck } from "$lib/func/contentCheck";
  import { clientTag } from "$lib/func/constants";
  import { addToast } from "./Elements/Toast.svelte";

  // ----------------------------------------
  // Component Props
  // ----------------------------------------
  interface Props {
    options?: DefaultPostOptions;
    propSignPubkey?: string | undefined;
    visible?: boolean;
  }

  let {
    options = {
      tags: [],
      kind: 1,
      content: "",
    },
    propSignPubkey,
    visible = true,
  }: Props = $props();

  // ----------------------------------------
  // Constants
  // ----------------------------------------
  const bulkReplyThreshold = 30;

  // ----------------------------------------
  // Dialog Setup
  // ----------------------------------------
  const { elements, states } = createDialog({
    forceVisible: true,
    closeOnOutsideClick: false,
    escapeBehavior: "ignore",
  });

  const { trigger, overlay, content, close, portalled } = elements;
  const { open } = states;

  // ----------------------------------------
  // State Management
  // ----------------------------------------
  let clickEscape: number = $state(0);
  let signPubkey: string | undefined = $state();
  let isPosting: boolean = $state(false);
  let additionalReplyUsers: string[] = $state([]);
  let initOptions: MargePostOptions = $state({
    tags: [],
    kind: 1,
    content: "",
  });

  // Dialog handlers
  let openConfirm: boolean = $state(false);
  let openHellConfirm: boolean = $state(false);
  let resetCreatePost: () => void = $state(() => {});

  let textarea: HTMLTextAreaElement | undefined = $state();

  // ----------------------------------------
  // User Authentication
  // ----------------------------------------
  async function getSignPubkey() {
    if (propSignPubkey) {
      signPubkey = propSignPubkey;
      return;
    }

    $nowProgress = true;

    try {
      if (!loginUser.value) {
        const pubkey = await (
          window.nostr as Nostr.Nip07.Nostr
        )?.getPublicKey();
        if (pubkey) {
          loginUser.value = pubkey;
        }
      }

      if (loginUser.value) {
        signPubkey = loginUser.value;
      }
    } catch (error) {
      showToast("Error", "Failed to get sign pubkey", "bg-red-500");
    } finally {
      $nowProgress = false;
    }
  }

  // ----------------------------------------
  // Utility Functions
  // ----------------------------------------
  function showToast(title: string, description: string, color: string) {
    addToast({
      data: { title, description, color },
    });
  }

  // ----------------------------------------
  // Event Publishing
  // ----------------------------------------
  async function sendEvent(newev: Nostr.EventParameters) {
    if (!newev || isPosting) return;

    isPosting = true;
    $nowProgress = true;
    const signer = nip07Signer();
    const newevent = $state.snapshot(newev);
    try {
      if (lumiSetting.get().protectedEvents) {
        newevent.tags = [["-"], ...(newevent.tags || [])];
      }

      const event = await signer.signEvent($state.snapshot(newevent));

      const { event: ev, res } = await promisePublishSignedEvent(event);

      const successRelays = res
        .filter((item) => item.ok)
        .map((item) => item.from);

      if (successRelays.length <= 0) {
        const { event: ev, res: res2 } = await promisePublishSignedEvent(event);
        const successRelays2 = res2
          .filter((item) => item.ok)
          .map((item) => item.from);

        if (successRelays2.length <= 0) {
          showToast("Failed", "Failed to publish", "bg-red-500");
        } else {
          $open = false;
        }
      } else {
        $open = false;
      }
    } catch (error) {
      console.log(error);
      showToast("Failed", "Failed to publish", "bg-red-500");
    } finally {
      $nowProgress = false;
      isPosting = false;
    }
  }

  async function handleSendEvent(eventData: {
    text: string;
    tags: string[][];
    onWarning: boolean;
    warningText: string;
    additionalReplyUsers: string[];
  }) {
    if (eventData.text.trim().length <= 0 || isPosting) return;

    const { text: checkedText, tags: checkedTags } = contentCheck(
      eventData.text.trim(),
      eventData.tags
    );

    if (eventData.onWarning) {
      checkedTags.push(["content-warning", eventData.warningText]);
    }

    if (eventData.additionalReplyUsers.length > 0) {
      const replyUsersArray = eventData.additionalReplyUsers.map((user) => [
        "p",
        user,
      ]);
      checkedTags.push(...replyUsersArray);
    }

    if (lumiSetting.get().addClientTag) {
      checkedTags.push(clientTag);
    }

    const newev = {
      kind: initOptions.kind,
      content: checkedText,
      tags: checkedTags,
    };

    const pTagCount = checkedTags.filter((tag) => tag[0] === "p").length;
    if (pTagCount > bulkReplyThreshold) {
      openHellConfirm = true;
      return;
    }

    await sendEvent(newev);
  }

  // ----------------------------------------
  // UI Interaction
  // ----------------------------------------
  function handleOverlayClick(event: MouseEvent) {
    if (textarea?.value.trim()) {
      openConfirm = true;
    } else {
      $open = false;
    }
  }

  function keyboardShortcut(event: KeyboardEvent) {
    event.preventDefault();
    const activeElement = document.activeElement;

    if ($open === true && event.key === "Escape") {
      clickEscape++;
      if (clickEscape >= 2) {
        clickEscape = 0;
        $open = false;
      }
      return;
    }

    if (
      event.key === "n" &&
      $open === false &&
      !(activeElement instanceof HTMLInputElement) &&
      !(activeElement instanceof HTMLTextAreaElement)
    ) {
      $open = true;
    }
  }

  // ----------------------------------------
  // Subscription Handlers
  // ----------------------------------------
  postWindowOpen.subscribe((value) => {
    if (!value) return;

    const addOption = $state.snapshot($additionalPostOptions);

    if (addOption) {
      // 追加オプションがある場合の処理
      if (addOption.addableUserList) {
        additionalReplyUsers = [...addOption.addableUserList];
      }

      // 設定情報を初期化（textとtagsの初期値もここに含める）
      initOptions = {
        ...options,
        kind: addOption.kind ?? options.kind ?? 1,
        content: (options.content ?? "") + addOption.content,
        tags: (() => {
          const combinedTags = options.tags.concat(addOption.tags);
          let hasRoot = false;
          return combinedTags.filter((tag) => {
            if (tag.includes("root")) {
              if (!hasRoot) {
                hasRoot = true;
                return true;
              }
              return false;
            }
            return true;
          });
        })(),
        defaultUsers: addOption.defaultUsers,
        addableUserList: addOption.addableUserList,
        warningText: addOption.warningText,
      };

      setTimeout(() => {
        $additionalPostOptions = undefined;
      }, 0);
    } else {
      // 追加オプションがない場合は通常のoptionsから設定
      additionalReplyUsers = [];

      initOptions = {
        ...options,
        kind: options.kind ?? 1,
      };
    }

    $open = true;
    $postWindowOpen = false;
  });

  open.subscribe((value) => {
    if (value) {
      // 追加オプションがある場合はpostWindowOpen.subscribeで処理されるので、
      // ここでは通常のoptionsのみ処理
      if (!$postWindowOpen && !$additionalPostOptions) {
        // 編集可能な値を初期化（CreatePostで管理）
        additionalReplyUsers = [];

        // 設定情報を初期化
        initOptions = {
          ...options,
          kind: options.kind ?? 1,
        };
      }

      getSignPubkey();
      clickEscape = 0;
    } else {
      resetCreatePost();
    }
  });
</script>

<svelte:window onkeyup={keyboardShortcut} />
{#if visible}
  <button
    title="Open post window (N)"
    use:melt={$trigger}
    class="inline-flex items-center justify-center rounded-full bg-neutral-900 border border-magnum-300 p-3.5
  font-medium leading-none text-magnum-300 shadow hover:opacity-75 z-30"
  >
    <SquarePen size={28} />
  </button>
{/if}

{#if $open}
  <div use:melt={$portalled} class="fixed top-0 left-0 z-50">
    <button
      aria-label="overlay"
      use:melt={$overlay}
      class="fixed inset-0 z-50 bg-black/50"
      transition:fade={{ duration: 150 }}
      onclick={handleOverlayClick}
    ></button>

    <div
      class="fixed left-1/2 top-[calc(50%-32px)] z-50 max-h-[90vh] w-[640px]
            max-w-[95vw] -translate-x-1/2 -translate-y-1/2 overflow-y-auto"
      use:melt={$content}
    >
      <CreatePost
        bind:textarea
        {close}
        {initOptions}
        {signPubkey}
        {isPosting}
        bind:additionalReplyUsers
        bind:resetCreatePost
        onSendEvent={handleSendEvent}
      />
    </div>
  </div>
{/if}

<AlertDialog
  id="confirm-close-dialog"
  okButtonName="Yes, close"
  bind:open={openConfirm}
  closeOnOutsideClick={true}
  onClickOK={() => {
    open.set(false);
    openConfirm = false;
  }}
  title="Confirm close"
>
  {#snippet main()}{$_("post.confirm")}
  {/snippet}
</AlertDialog>

<AlertDialog
  id="hell-confirm-dialog"
  okButtonName="Yes, send"
  bind:open={openHellConfirm}
  closeOnOutsideClick={true}
  onClickOK={async () => {
    openHellConfirm = false;
  }}
  title="Confirm Reply to Many People"
>
  {#snippet main()}{$_("post.hell")}
  {/snippet}
</AlertDialog>

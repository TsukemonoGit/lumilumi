<script lang="ts">
  import {
    pubkeysIn,
    usePromiseReq,
    promisePublishSignedEvent,
    makeMainFilters,
    changeMainEmit,
  } from "$lib/func/nostr";
  import { nowProgress, queryClient, toastSettings } from "$lib/stores/stores";
  import {
    nip07Signer,
    type EventPacket,
    type OkPacketAgainstEvent,
    now,
  } from "rx-nostr";
  import { t as _, locale } from "@konemono/svelte5-i18n";
  import * as Nostr from "nostr-typedef";

  import {
    datetime,
    formatAbsoluteDate,
    formatRelativeDate,
    formatToEventPacket,
    generateResultMessage,
  } from "$lib/func/util";
  import { ArrowBigDown } from "lucide-svelte";
  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";
  import { pipe } from "rxjs";
  import { latest } from "rx-nostr/src";
  import { type QueryKey } from "@tanstack/svelte-query";
  import { validateLoginPubkey } from "$lib/func/validateLoginPubkey";
  import { followList, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { safePublishEvent } from "$lib/func/publishError";

  interface Props {
    pubkey: string;
  }

  let { pubkey }: Props = $props();

  let beforeKind3: Nostr.Event | undefined = $state();
  let afterEventParameters: Nostr.EventParameters | undefined = $state();

  // svelte-ignore non_reactive_update
  let dialogOpen: (bool: boolean) => void = () => {};

  let contactsQueryKey: QueryKey = $derived([
    "timeline",
    "contacts",
    lumiSetting.get().pubkey,
  ]);
  let isfollowee: boolean = $derived(followList.get().has(pubkey));

  // Public key validation
  const CheckLoginPubkey = async (): Promise<boolean> => {
    const res = await validateLoginPubkey();
    if (res.status) {
      return true;
    } else if (res.message) {
      showToast("Error", res.message, "bg-red-500");
    }
    return false;
  };

  // Show toast notification
  const showToast = (title: string, description: string, color: string) => {
    $toastSettings = { title, description, color };
  };

  // svelte-ignore non_reactive_update
  let dialogCreateKind3Open: (bool: boolean) => void = () => {};

  // Handle follow/unfollow logic
  const handleFollow = async () => {
    if (!(await CheckLoginPubkey())) return;

    const followState = followList.get().has(pubkey);
    const kind3Event: EventPacket | undefined =
      queryClient.getQueryData(contactsQueryKey); //この時点ではまだfollowList.get()を持っていない可能性があるので取得する

    await refreshContactsData(kind3Event);

    if (!beforeKind3) {
      //新しいKind3作っていいですかを出す
      dialogCreateKind3Open?.(true);
      return;
    }

    //isfollowee = followList.get().get.has(pubkey);

    if (followState !== followList.get().has(pubkey)) {
      $nowProgress = false;
      return;
    }

    handleFollowStateChange();
  };

  const refreshContactsData = async (kind3Event: EventPacket | undefined) => {
    $nowProgress = true;
    console.log(lumiSetting.get().pubkey);
    // await queryClient.refetchQueries({ queryKey: contactsQueryKey });
    // await delay(1000);
    // const newKind3: EventPacket | undefined =
    //   queryClient.getQueryData(contactsQueryKey);
    const newKind3: EventPacket[] = await usePromiseReq(
      {
        filters: [
          { kinds: [3], authors: [lumiSetting.get().pubkey], limit: 1 },
        ],
        operator: pipe(latest()),
      },
      undefined,
      2000
    );
    // console.log("newKind3", newKind3);
    // console.log("kind3Event", kind3Event);
    if (
      !kind3Event ||
      (newKind3.length > 0 &&
        newKind3[0].event.created_at > kind3Event.event.created_at)
    ) {
      queryClient.setQueryData(contactsQueryKey, (oldData: any) => newKind3[0]);

      const pubkeyList = pubkeysIn(newKind3[0].event);
      followList.set(pubkeyList);
      beforeKind3 = newKind3[0].event;
    } else if (kind3Event) {
      beforeKind3 = kind3Event.event;
    }

    // console.log("beforeKind3", beforeKind3);
  };

  const handleFollowStateChange = () => {
    const snapbefore = $state.snapshot(beforeKind3);
    if (!snapbefore) return;

    const tags = isfollowee
      ? snapbefore.tags.filter(
          ([tagName, pub]) => !(tagName === "p" && pub === pubkey)
        )
      : [...snapbefore.tags, ["p", pubkey]];

    afterEventParameters = {
      content: snapbefore.content,
      tags,
      kind: 3,
      pubkey: snapbefore.pubkey,
    };

    $nowProgress = false;
    dialogOpen?.(true);
  };

  // Handle event publishing
  const publishEvent = async () => {
    dialogOpen?.(false);
    $nowProgress = true;
    //kind3の更新はrelaySearchRelaysにも投げる（kind3,10002,kind0なんかそのへん特化（kind:3含むとこだけにする））

    try {
      const result = await safePublishEvent(
        $state.snapshot(afterEventParameters) as Nostr.Event
      );

      if ("errorCode" in result) {
        if (result.isCanceled) {
          return; // キャンセル時は何もしない
        }
        showToast("Failed", $_(result.errorCode), "bg-red-500");
        return;
      }

      // 成功時の処理
      handlePublishResult(result.res, result.event);
    } finally {
      $nowProgress = false;
    }
  };

  const handlePublishResult = (
    res: OkPacketAgainstEvent[],
    ev: Nostr.Event
  ) => {
    const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
    const isFailed = res.filter((item) => !item.ok).map((item) => item.from);
    const message = generateResultMessage(isSuccess, isFailed);

    showToast(
      isSuccess.length > 0 ? "Success" : "Failed",
      message,
      isSuccess.length > 0 ? "bg-green-500" : "bg-red-500"
    );

    if (isSuccess.length > 0) {
      //queryClient.refetchQueries({ queryKey: contactsQueryKey }); //これやったらnullになるはなおってるかもだけど別にリフェッチしなくていいか

      const packetEv = formatToEventPacket(ev, isSuccess[0]);

      queryClient.setQueryData(contactsQueryKey, packetEv);

      const pubkeyList = pubkeysIn(ev);
      followList.set(pubkeyList);

      const filters = makeMainFilters(ev, now());
      changeMainEmit(filters.mainFilters);
    }

    //  isfollowee = followList.get().get.has(pubkey);
    resetState();
  };

  const resetState = () => {
    beforeKind3 = undefined;
    afterEventParameters = undefined;
    $nowProgress = false;
  };

  // Handle petname dialog
  // svelte-ignore non_reactive_update
  let openPetnameDialog: (bool: boolean) => void = () => {};
  let petnameInput: string = $state("");

  const handlePetnameClick = async () => {
    let kind3Event: EventPacket | undefined =
      queryClient.getQueryData(contactsQueryKey);
    await refreshContactsData(kind3Event);
    petnameInput = followList.get().get(pubkey) ?? "";
    openPetnameDialog?.(true);
    $nowProgress = false;
  };

  const updatePetname = async () => {
    if (!beforeKind3) return;

    const beforePetname = followList.get().get(pubkey);
    if (
      (!beforePetname && petnameInput === "") ||
      beforePetname === petnameInput
    )
      return;

    const updatedTags = beforeKind3.tags.map((tag) => {
      if (tag[0] === "p" && tag[1] === pubkey) {
        return petnameInput === ""
          ? tag.slice(0, 3)
          : tag.length > 2
            ? [...tag.slice(0, 3), petnameInput]
            : ["p", pubkey, "", petnameInput];
      }
      return tag;
    });

    afterEventParameters = {
      content: beforeKind3.content,
      tags: updatedTags,
      kind: 3,
      pubkey: beforeKind3.pubkey,
    };
    publishEvent();
    openPetnameDialog?.(false);
  };

  const onClickOK = async () => {
    console.log("onClickOK");
    dialogCreateKind3Open?.(false);
    $nowProgress = true;
    const ev: Nostr.EventParameters = {
      kind: 3,
      content: "",
      tags: [
        ["p", lumiSetting.get().pubkey],
        ["p", pubkey],
      ],
    };
    const signer = nip07Signer();
    const event = await signer.signEvent(ev);
    if (event.pubkey !== lumiSetting.get().pubkey) {
      $toastSettings = {
        title: "Error",
        description: "login pubkey ≠ sign pubkey",
        color: "bg-red-500",
      };
      $nowProgress = false;
      return;
    } else {
      const { event: ev, res } = await promisePublishSignedEvent(event);
      const isSuccessRelays: OkPacketAgainstEvent[] = res.filter(
        (item) => item.ok
      );

      if (isSuccessRelays.length <= 0) {
        $toastSettings = {
          title: "Failed",
          description: "failed to publish",
          color: "bg-red-500",
        };
      }
    }
    $nowProgress = false;
  };
</script>

{#if lumiSetting.get().pubkey && isfollowee !== undefined}
  {#if isfollowee}
    <button
      disabled={$nowProgress}
      class={`rounded-full h-[32px] w-[32px] border border-magnum-300 break-keep disabled:opacity-25 font-medium leading-none text-magnum-300 bg-zinc-800 shadow hover:opacity-60 `}
      title={$_("user.petname.edit")}
      onclick={handlePetnameClick}
    >
      📛
    </button>
    <button
      disabled={$nowProgress}
      class={`rounded-full h-[32px] border border-magnum-300 p-2 break-keep disabled:opacity-25 font-medium leading-none text-magnum-300 bg-zinc-800 shadow hover:opacity-60 `}
      onclick={handleFollow}
    >
      {$_("user.following")}
    </button>
  {:else}
    <button
      disabled={$nowProgress}
      class={`rounded-full bg-white border border-magnum-700 p-2 break-keep disabled:opacity-25 font-medium leading-none text-magnum-700 shadow hover:opacity-60 h-[32px] `}
      onclick={handleFollow}
    >
      {$_("user.follow")}
    </button>
  {/if}
{/if}
<AlertDialog
  bind:openDialog={dialogOpen}
  onClickOK={publishEvent}
  title={$_("user.followList.get().update")}
>
  {#snippet main()}
    <div>
      <div class="text-magnum-500 font-bold text-lg mt-2">Before</div>
      {#if beforeKind3}
        <div
          class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[60vh] flex flex-wrap"
        >
          <ul class="leading-4">
            <li>
              Updated at <time
                class="font-semibold text-magnum-300"
                datetime={datetime(beforeKind3?.created_at)}
                >{formatAbsoluteDate(beforeKind3?.created_at, true)}</time
              ><span class="ml-2"
                >({formatRelativeDate(beforeKind3?.created_at, $locale)})</span
              >
            </li>
            <li>
              List length <span class="font-semibold text-zinc-200"
                >{beforeKind3?.tags.length}</span
              >
            </li>
            <li>
              Followee <span class="font-semibold text-zinc-200"
                >{beforeKind3?.tags?.reduce((acc, [tag, value]) => {
                  if (tag === "p") {
                    return [...acc, value];
                  } else {
                    return acc;
                  }
                }, []).length}</span
              >
            </li>
          </ul>
        </div>
      {/if}
      {#if afterEventParameters}
        <ArrowBigDown />
        <div class="text-magnum-500 font-bold text-lg mt-2">After</div>
        <div
          class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[60vh] flex flex-wrap"
        >
          <ul class="leading-4">
            <li>
              List length <span class="font-semibold text-magnum-300"
                >{afterEventParameters?.tags?.length}</span
              >
            </li>
            <li>
              Followee <span class="font-semibold text-magnum-300"
                >{afterEventParameters?.tags?.reduce((acc, [tag, value]) => {
                  if (tag === "p") {
                    return [...acc, value];
                  } else {
                    return acc;
                  }
                }, []).length}</span
              >
            </li>
          </ul>
        </div>
      {/if}
    </div>
  {/snippet}
</AlertDialog>

<AlertDialog
  bind:openDialog={openPetnameDialog}
  onClickOK={updatePetname}
  title={$_("user.petname.petname")}
  okButtonName="OK"
>
  {#snippet main()}
    <div>
      {#if beforeKind3}
        <div class="flex flex-col items-start justify-center">
          <p class="font-medium text-magnum-400">
            {$_("user.petname.write")} (NIP-02)
          </p>
          <p class="font-medium text-sm text-magnum-400">
            {$_("user.petname.warning")}
          </p>
          <input
            type="text"
            class="h-10 w-full rounded-md px-3 py-2 mt-2 border border-magnum-600 bg-neutral-900"
            bind:value={petnameInput}
          />
        </div>
        <div class="text-sm mt-6 bg-neutral-700 rounded-sm p-2">
          Follow List Updated at<time
            class="font-semibold text-magnum-300 ml-2"
            datetime={datetime(beforeKind3?.created_at)}
            >{formatAbsoluteDate(beforeKind3?.created_at, true)}</time
          >
          ({formatRelativeDate(beforeKind3?.created_at, $locale)})
        </div>
      {/if}
    </div>
  {/snippet}
</AlertDialog>

<AlertDialog
  bind:openDialog={dialogCreateKind3Open}
  {onClickOK}
  title={$_("create_kind3.create")}
  >{#snippet main()}
    <div class=" text-neutral-200 whitespace-pre-wrap">
      {$_("create_kind3.newMessage")}
    </div>
  {/snippet}</AlertDialog
>

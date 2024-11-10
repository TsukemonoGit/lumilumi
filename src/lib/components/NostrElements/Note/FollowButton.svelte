<script lang="ts">
  import {
    pubkeysIn,
    promisePublishEvent,
    usePromiseReq,
    promisePublishSignedEvent,
    makeMainFilters,
    changeMainEmit,
  } from "$lib/func/nostr";
  import {
    followList,
    loginUser,
    nowProgress,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";
  import {
    nip07Signer,
    type EventPacket,
    type OkPacketAgainstEvent,
    now,
  } from "rx-nostr";
  import { _, locale } from "svelte-i18n";
  import * as Nostr from "nostr-typedef";
  import { writable } from "svelte/store";
  import {
    datetime,
    delay,
    formatAbsoluteDate,
    formatRelativeDate,
    generateResultMessage,
  } from "$lib/func/util";
  import { ArrowBigDown } from "lucide-svelte";
  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";
  import { pipe } from "rxjs";
  import { latest } from "rx-nostr/src";

  export let pubkey: string;

  const beforeKind3 = writable<Nostr.Event | undefined>();
  const afterEventParameters = writable<Nostr.EventParameters | undefined>();
  let dialogOpen: any;

  $: contactsQueryKey = ["timeline", "contacts", $loginUser];
  $: isfollowee = $followList.has(pubkey);

  // Public key validation
  const validateLoginPubkey = async (): Promise<boolean> => {
    if ($loginUser === "") return false;
    try {
      const signPubkey = await (
        window.nostr as Nostr.Nip07.Nostr
      )?.getPublicKey();
      if ($loginUser !== signPubkey) {
        showToast("Error", "login pubkey ≠ sign pubkey", "bg-red-500");
        return false;
      }
      return true;
    } catch (error) {
      showToast("Error", "failed to get sign pubkey", "bg-red-500");
      return false;
    }
  };

  // Show toast notification
  const showToast = (title: string, description: string, color: string) => {
    $toastSettings = { title, description, color };
  };

  let dialogCreateKind3Open: any;

  // Handle follow/unfollow logic
  const handleFollow = async () => {
    if (!(await validateLoginPubkey())) return;

    const followState = $followList.has(pubkey);
    const kind3Event: EventPacket | undefined =
      $queryClient.getQueryData(contactsQueryKey); //この時点ではまだfollowListを持っていない可能性があるので取得する

    await refreshContactsData(kind3Event);

    if (!$beforeKind3) {
      //新しいKind3作っていいですかを出す
      $dialogCreateKind3Open = true;
      return;
    }

    isfollowee = $followList.has(pubkey);

    if (followState !== isfollowee) {
      $nowProgress = false;
      return;
    }

    handleFollowStateChange();
  };

  const refreshContactsData = async (kind3Event: EventPacket | undefined) => {
    $nowProgress = true;
    console.log($loginUser);
    // await $queryClient.refetchQueries({ queryKey: contactsQueryKey });
    // await delay(1000);
    // const newKind3: EventPacket | undefined =
    //   $queryClient.getQueryData(contactsQueryKey);
    const newKind3: EventPacket[] = await usePromiseReq(
      {
        filters: [{ kinds: [3], authors: [$loginUser], limit: 1 }],
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
      $queryClient.setQueryData(
        contactsQueryKey,
        (oldData: any) => newKind3[0]
      );

      pubkeysIn(newKind3[0].event);
      $beforeKind3 = newKind3[0].event;
    } else if (kind3Event) {
      $beforeKind3 = kind3Event.event;
    }

    // console.log("$beforeKind3", $beforeKind3);
  };

  const handleFollowStateChange = () => {
    if (!$beforeKind3) return;

    const tags = isfollowee
      ? $beforeKind3.tags.filter(
          ([tagName, pub]) => !(tagName === "p" && pub === pubkey)
        )
      : [...$beforeKind3.tags, ["p", pubkey]];

    $afterEventParameters = {
      content: $beforeKind3.content,
      tags,
      kind: 3,
      pubkey: $beforeKind3.pubkey,
    };

    $nowProgress = false;
    $dialogOpen = true;
  };

  // Handle event publishing
  const publishEvent = async () => {
    $dialogOpen = false;
    $nowProgress = true;

    const { event: ev, res } = await promisePublishEvent(
      $afterEventParameters as Nostr.Event
    );
    handlePublishResult(res, ev);
  };

  const handlePublishResult = (res: any[], ev: Nostr.Event) => {
    const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
    const isFailed = res.filter((item) => !item.ok).map((item) => item.from);
    const message = generateResultMessage(isSuccess, isFailed);

    showToast(
      isSuccess.length > 0 ? "Success" : "Failed",
      message,
      isSuccess.length > 0 ? "bg-green-500" : "bg-red-500"
    );

    if (isSuccess.length > 0) {
      $queryClient.refetchQueries({ queryKey: contactsQueryKey });
      pubkeysIn(ev);
      const filters = makeMainFilters(ev, now());
      changeMainEmit(filters.mainFilters);
    }

    isfollowee = $followList.has(pubkey);
    resetState();
  };

  const resetState = () => {
    $beforeKind3 = undefined;
    $afterEventParameters = undefined;
    $nowProgress = false;
  };

  // Handle petname dialog
  let openPetnameDialog:
    | {
        update: (
          updater: import("svelte/store").Updater<boolean>,
          sideEffect?: ((newValue: boolean) => void) | undefined
        ) => void;
        set: (this: void, value: boolean) => void;
        subscribe(
          this: void,
          run: import("svelte/store").Subscriber<boolean>,
          invalidate?: import("svelte/store").Invalidator<boolean> | undefined
        ): import("svelte/store").Unsubscriber;
        get: () => boolean;
        destroy?: (() => void) | undefined;
      }
    | undefined;
  let petnameInput: string = "";

  const handlePetnameClick = async () => {
    let kind3Event: EventPacket | undefined =
      $queryClient.getQueryData(contactsQueryKey);
    await refreshContactsData(kind3Event!);
    petnameInput = $followList.get(pubkey) ?? "";
    $openPetnameDialog = true;
    $nowProgress = false;
  };

  const updatePetname = async () => {
    if (!$beforeKind3) return;

    const beforePetname = $followList.get(pubkey);
    if (
      (!beforePetname && petnameInput === "") ||
      beforePetname === petnameInput
    )
      return;

    const updatedTags = $beforeKind3.tags.map((tag) => {
      if (tag[0] === "p" && tag[1] === pubkey) {
        return petnameInput === ""
          ? tag.slice(0, 3)
          : tag.length > 2
            ? [...tag.slice(0, 3), petnameInput]
            : ["p", pubkey, "", petnameInput];
      }
      return tag;
    });

    $afterEventParameters = {
      content: $beforeKind3.content,
      tags: updatedTags,
      kind: 3,
      pubkey: $beforeKind3.pubkey,
    };
    publishEvent();
    $openPetnameDialog = false;
  };

  const onClickOK = async () => {
    console.log("onClickOK");
    $dialogCreateKind3Open = false;
    $nowProgress = true;
    const ev: Nostr.EventParameters = {
      kind: 3,
      content: "",
      tags: [
        ["p", $loginUser],
        ["p", pubkey],
      ],
    };
    const signer = nip07Signer();
    const event = await signer.signEvent(ev);
    if (event.pubkey !== $loginUser) {
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

{#if isfollowee !== undefined}
  {#if isfollowee}
    <button
      disabled={$nowProgress}
      class={`rounded-full h-[32px] w-[32px] border border-magnum-300 break-keep disabled:opacity-25 font-medium leading-none text-magnum-300 bg-zinc-800 shadow hover:opacity-60 `}
      title={$_("user.petname.edit")}
      on:click={handlePetnameClick}
    >
      📛
    </button>
    <button
      disabled={$nowProgress}
      class={`rounded-full h-[32px] border border-magnum-300 p-2 break-keep disabled:opacity-25 font-medium leading-none text-magnum-300 bg-zinc-800 shadow hover:opacity-60 `}
      on:click={handleFollow}
    >
      {$_("user.following")}
    </button>
  {:else}
    <button
      disabled={$nowProgress}
      class={`rounded-full bg-white border border-magnum-700 p-2 break-keep disabled:opacity-25 font-medium leading-none text-magnum-700 shadow hover:opacity-60 h-[32px] `}
      on:click={handleFollow}
    >
      {$_("user.follow")}
    </button>
  {/if}
{/if}

<AlertDialog
  bind:open={dialogOpen}
  onClickOK={publishEvent}
  title={$_("user.followList.update")}
>
  <div slot="main">
    <div class="text-magnum-500 font-bold text-lg mt-2">Before</div>
    {#if $beforeKind3}
      <div
        class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[60vh] flex flex-wrap"
      >
        <ul class="leading-4">
          <li>
            Updated at <time
              class="font-semibold text-magnum-300"
              datetime={datetime($beforeKind3?.created_at)}
              >{formatAbsoluteDate($beforeKind3?.created_at, true)}</time
            ><span class="ml-2"
              >({formatRelativeDate($beforeKind3?.created_at, $locale)})</span
            >
          </li>
          <li>
            List length <span class="font-semibold text-zinc-200"
              >{$beforeKind3?.tags.length}</span
            >
          </li>
          <li>
            Followee <span class="font-semibold text-zinc-200"
              >{pubkeysIn($beforeKind3).size}</span
            >
          </li>
        </ul>
      </div>
    {/if}
    {#if $afterEventParameters}
      <ArrowBigDown />
      <div class="text-magnum-500 font-bold text-lg mt-2">After</div>
      <div
        class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[60vh] flex flex-wrap"
      >
        <ul class="leading-4">
          <li>
            List length <span class="font-semibold text-magnum-300"
              >{$afterEventParameters?.tags?.length}</span
            >
          </li>
          <li>
            Followee <span class="font-semibold text-magnum-300"
              >{$afterEventParameters?.tags?.reduce((acc, [tag, value]) => {
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
</AlertDialog>

<AlertDialog
  bind:open={openPetnameDialog}
  onClickOK={updatePetname}
  title={$_("user.petname.petname")}
  okButtonName="OK"
>
  <div slot="main">
    {#if $beforeKind3}
      <div class="flex flex-col items-start justify-center">
        <div class="font-medium text-magnum-400">
          {$_("user.petname.write")} (NIP-02)
        </div>
        <input
          type="text"
          class="h-10 w-full rounded-md px-3 py-2 mt-2 border border-magnum-600 bg-neutral-900"
          bind:value={petnameInput}
        />
      </div>
      <div class="text-sm mt-6 bg-neutral-700 rounded-sm p-2">
        Follow List Updated at<time
          class="font-semibold text-magnum-300 ml-2"
          datetime={datetime($beforeKind3?.created_at)}
          >{formatAbsoluteDate($beforeKind3?.created_at, true)}</time
        >
        ({formatRelativeDate($beforeKind3?.created_at, $locale)})
      </div>
    {/if}
  </div>
</AlertDialog>

<AlertDialog
  bind:open={dialogCreateKind3Open}
  {onClickOK}
  title={$_("create_kind3.create")}
  ><div slot="main" class=" text-neutral-200 whitespace-pre-wrap">
    {$_("create_kind3.newMessage")}
  </div></AlertDialog
>

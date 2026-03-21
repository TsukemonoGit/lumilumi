<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";
  import ListLinkCard from "$lib/components/NostrElements/kindEvents/EventCard/ListLinkCard.svelte";
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";

  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";

  import TimelineList from "$lib/components/renderSnippets/nostr/TimelineList.svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { publishEvent, setRelays } from "$lib/func/nostr";
  import { defaultRelays, nowProgress, queryClient } from "$lib/stores/stores";
  import type { QueryKey } from "@tanstack/svelte-query";

  import * as Nostr from "nostr-typedef";

  import { createRxForwardReq, now, type EventPacket } from "rx-nostr";
  import { onMount } from "svelte";

  import type { PageData } from "./$types";
  import { decryptContent, encryptPrvTags } from "$lib/func/settings";
  import { t } from "@konemono/svelte5-i18n";

  import IconButton from "$lib/components/Elements/IconButton.svelte";
  import { Delete, Plus, Undo2 } from "lucide-svelte";
  import { hexRegex } from "$lib/func/regex";
  import ListUserIcon from "$lib/components/NostrElements/ListUserIcon.svelte";
  import { addToast } from "$lib/components/Elements/Toast.svelte";
  import { safePublishEvent } from "$lib/func/publishError";
  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";
  import UserName from "$lib/components/NostrElements/user/UserName.svelte";
  import { formatToEventPacket } from "$lib/func/util";

  let { data }: { data: PageData } = $props();

  let atag = $derived(`${data.kind}:${data.pubkey}:${data.identifier}`);
  let filters: Nostr.Filter[] = $derived([
    { "#d": [data.identifier], kinds: [data.kind], authors: [data.pubkey] },
  ]);

  let amount = 50;
  let viewIndex = 0;

  let loading = $state(true);

  let isOnMount = false;
  let since: number | undefined = $state(undefined);
  let timelineQuery: QueryKey = $derived(["list", "feed", atag]);

  // 削除確認ダイアログ用
  let dialogOpen = $state(false);
  let pendingDelete = $state<{
    pubkey: string;
    eventParameters: Nostr.EventParameters;
  } | null>(null);

  onMount(async () => {
    if (!isOnMount) {
      isOnMount = true;
      await init();
      isOnMount = false;
    }
  });

  afterNavigate((navigate) => {
    if (navigate.type !== "form" && !isOnMount) {
      isOnMount = true;
      init();
      isOnMount = false;
    }
  });

  async function init() {
    since = undefined;

    if ($defaultRelays) {
      setRelays($defaultRelays);
    } else if (!$defaultRelays && data.relays) {
      setRelays(data.relays);
    }
    const ev: EventPacket[] | undefined = queryClient?.getQueryData([
      ...timelineQuery,
      "olderData",
    ]);
    if (!ev || ev.length <= 0) {
      since = now() - 15 * 60;
    } else {
      since = ev[0].event.created_at;
    }
    loading = false;
  }

  const pubkeyList = (
    event: Nostr.Event,
    decryptContent: string[][] | null,
  ): string[] => {
    const pubList = event.tags
      .filter((tag) => tag[0] === "p" && hexRegex.test(tag[1]))
      .map((tag) => tag[1]);

    if (event.content.length <= 0) {
      return pubList;
    }
    try {
      if (decryptContent && decryptContent.length > 0) {
        const prv = decryptContent
          .filter((tag) => tag[0] === "p" && hexRegex.test(tag[1]))
          .map((tag) => tag[1]);
        return Array.from(new Set([...pubList, ...prv]));
      } else {
        return pubList;
      }
    } catch (error) {
      return pubList;
    }
  };

  let deleteMode = $state(false);

  function openAddUser(event: Nostr.Event<number>): void {
    throw new Error("Function not implemented.");
  }

  async function deleteUser(
    type: "pub" | "prv",
    index: number,
    event: Nostr.Event,
    decryptedContent?: string[][],
  ): Promise<void> {
    let eventParameters: Nostr.EventParameters;
    let pubkey: string;

    if (type === "pub") {
      pubkey = event.tags[index]?.[1] ?? "";
      const newTags = event.tags.filter((_, i) => i !== index);
      eventParameters = {
        kind: event.kind,
        tags: $state.snapshot(newTags),
        content: event.content,
      };
    } else {
      if (!decryptedContent) return;
      pubkey = decryptedContent[index]?.[1] ?? "";
      const newDecryptContent = decryptedContent.filter((_, i) => i !== index);
      const encryptedContent = await encryptPrvTags(
        event.pubkey,
        newDecryptContent,
      );
      if (!encryptedContent) {
        addToast({
          data: {
            title: "Error",
            description: "Failed to encrypt",
            color: "bg-red-500",
          },
        });
        return;
      }
      eventParameters = {
        kind: event.kind,
        tags: $state.snapshot(event.tags),
        content: encryptedContent,
      };
    }

    pendingDelete = { pubkey, eventParameters };
    dialogOpen = true;
  }

  async function handleClickOk() {
    if (!pendingDelete) return;
    await publishList(pendingDelete.eventParameters);
    pendingDelete = null;
  }

  async function publishList(eventParameters: Nostr.EventParameters) {
    $nowProgress = true;
    const result = await safePublishEvent(eventParameters);
    if ("errorCode" in result) {
      if (result.isCanceled) {
        $nowProgress = false;
        return false;
      }
      addToast({
        data: {
          title: "Error",
          description: $t(result.errorCode),
          color: "bg-red-500",
        },
      });
      $nowProgress = false;
      return false;
    }
    const { event: ev, res } = result;
    const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
    console.log(isSuccess);
    if (isSuccess.length <= 0) {
      addToast({
        data: {
          title: "Error",
          description: "Failed to publish",
          color: "bg-red-500",
        },
      });
    } else {
      queryClient.setQueryData(["naddr", atag], formatToEventPacket(ev));
    }
    $nowProgress = false;
  }
</script>

{#if loading}
  loading
{:else}
  <section class=" w-full break-words overflow-hidden">
    <LatestEvent queryKey={["naddr", atag]} {filters}>
      {#snippet loading()}
        <div>loading</div>
      {/snippet}
      {#snippet error()}
        <div>error</div>
      {/snippet}
      {#snippet nodata()}
        <div>nodata</div>
      {/snippet}
      {#snippet success({ event })}
        {#await decryptContent(event)}
          waiting decrypt list
        {:then decryptContent}
          {@const pubkeys = pubkeyList(event, decryptContent)}

          <div class="w-full flex justify-between">
            <ListLinkCard {event} depth={0} />
          </div>

          <div class="grid w-full grid-cols-[32px_1fr_32px] gap-2 mt-2">
            <IconButton
              variant={"fill"}
              title={"ListMemberAdder"}
              onclick={() => openAddUser(event)}
            >
              <Plus /></IconButton
            >
            <!--publist-->
            <div class="flex gap-1 flex-wrap">
              {#each event.tags as tag, index}
                {#if tag[0] === "p" && hexRegex.test(tag[1])}
                  <ListUserIcon
                    pubkey={tag[1]}
                    onDelete={() => deleteUser("pub", index, event)}
                    {deleteMode}
                  />
                {/if}{/each}
              <!--prvlist-->
              {#each decryptContent || [] as tag, index}
                {#if tag[0] === "p" && hexRegex.test(tag[1])}
                  <ListUserIcon
                    pubkey={tag[1]}
                    onDelete={() =>
                      deleteUser("prv", index, event, decryptContent || [])}
                    {deleteMode}
                  />
                {/if}{/each}
            </div>
            {#if pubkeys.length > 0}<IconButton
                variant={"fill"}
                title={deleteMode ? "Cancel Delete" : "Delete User"}
                onclick={() => (deleteMode = !deleteMode)}
              >
                {#if deleteMode}
                  <Undo2 />
                {:else}
                  <Delete />
                {/if}
              </IconButton>{/if}
          </div>

          {#if pubkeys.length > 0}
            {#if since}
              <TimelineList
                queryKey={timelineQuery}
                filters={[
                  {
                    kinds: [1, 6, 16],
                    authors: pubkeys,
                    since: since,
                  },
                ]}
                olderFilters={[
                  {
                    kinds: [1, 6, 16],
                    authors: pubkeys,
                    since: since,
                  },
                ]}
                req={createRxForwardReq()}
                {viewIndex}
                {amount}
              >
                {#snippet content({ events, len })}
                  <div
                    class="max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
                  >
                    {#if events && events.length > 0}
                      {#each events as event, index (event.id)}
                        <Metadata
                          queryKey={["metadata", event.pubkey]}
                          pubkey={event.pubkey}
                        >
                          {#snippet loading()}
                            <div class="w-full">
                              <EventCard note={event} />
                            </div>
                          {/snippet}
                          {#snippet nodata()}
                            <div class="w-full">
                              <EventCard note={event} />
                            </div>
                          {/snippet}
                          {#snippet error()}
                            <div class="w-full">
                              <EventCard note={event} />
                            </div>
                          {/snippet}
                          {#snippet content({ metadata })}
                            <EventCard {metadata} note={event} />
                          {/snippet}
                        </Metadata>
                      {/each}{/if}
                  </div>{/snippet}
                {#snippet loading()}
                  <div>
                    <p>Loading...</p>
                  </div>
                {/snippet}

                {#snippet error()}
                  <div>
                    <p>{error}</p>
                  </div>
                {/snippet}
              </TimelineList>{/if}{:else}
            {$t("list.nobody")}
          {/if}
        {/await}
      {/snippet}
    </LatestEvent>
  </section>
  <div class="postWindow">
    <OpenPostWindow
      options={{
        tags: [],
        kind: 1,
      }}
    />
  </div>
{/if}

<AlertDialog
  bind:open={dialogOpen}
  onClickOK={() => {
    dialogOpen = false;
    handleClickOk();
  }}
  title={$t("list.deleteUserConfirmTitle")}
  okButtonName="OK"
>
  {#snippet main()}
    <div class="flex justify-center items-center">
      <ListUserIcon
        deleteMode={false}
        pubkey={pendingDelete?.pubkey ?? ""}
      /><UserName pubhex={pendingDelete?.pubkey ?? ""} />
    </div>
  {/snippet}
</AlertDialog>

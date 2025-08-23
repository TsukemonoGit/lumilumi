<script lang="ts">
  import { now, type EventPacket } from "rx-nostr";
  import { queryClient } from "$lib/stores/stores";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { onMount } from "svelte";
  import { createToggleGroup, melt } from "@melt-ui/svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import type { QueryKey } from "@tanstack/svelte-query";
  import type * as Nostr from "nostr-typedef";

  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import NotificationFilter from "./NotificationFilter.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";
  import NotificationList from "./NotificationList.svelte";
  import { extractKind9734 } from "$lib/func/zap";
  import {
    followList,
    lumiSetting,
    notifiSettings,
  } from "$lib/stores/globalRunes.svelte";

  import { notificationKinds } from "$lib/func/constants";
  import { NOTIFICATION_TYPES } from "./notificationTypes";
  import { saveNotifiSettings } from "./notifiSettingsRepository";

  // Constants
  const TIMELINE_QUERY: QueryKey = ["notifications"];
  const DISPLAY_AMOUNT = 50;
  const INITIAL_LOAD_LIMIT = 100;

  // Initialize toggle group for notification filtering
  const {
    elements: { root, item },
    states: { value },
  } = createToggleGroup({
    type: "multiple",
    defaultValue: notifiSettings.get().selects,
  });

  // State
  let viewIndex = 0;
  let isOnMount = false;
  let view = $state(false);
  let updateViewNotifi: () => void = $state(() => {});

  // Build initial filters
  let filters: Nostr.Filter[] | null = $derived(
    lumiSetting.get()?.pubkey
      ? [
          {
            kinds: notificationKinds,
            "#p": [lumiSetting.get().pubkey],
            since: undefined,
            until: undefined,
            limit: undefined,
          },
        ]
      : null
  );

  // Lifecycle hooks
  onMount(async () => {
    if (!isOnMount) {
      isOnMount = true;
      await initializeNotifications();
      isOnMount = false;
      view = true;
    }
  });

  afterNavigate(async (navigate) => {
    if (navigate.type !== "form" && !isOnMount) {
      isOnMount = true;
      await initializeNotifications();
      isOnMount = false;
      view = true;
    }
  });

  beforeNavigate((navigate) => {
    if (navigate.type !== "form") {
      view = false;
    }
  });

  // Subscribe to filter changes
  value?.subscribe((val) => {
    setTimeout(() => {
      if (Array.isArray(val) && updateViewNotifi) {
        updateViewNotifi();

        saveNotifiSettings({
          onlyFollowee: notifiSettings.get().onlyFollowee,
          selects: val,
        });
      }
    }, 0);
  });

  // Filter helpers
  function getNotificationFilterPredicate(event: Nostr.Event): boolean {
    if (event.pubkey === lumiSetting.get()?.pubkey) return false;

    if (notifiSettings.get().onlyFollowee && followList.get()) {
      if (!isEventFromFollowedUser(event)) return false;
    }

    if ([7, 6, 16].includes(event.kind)) {
      if (!isEventAddressedToUser(event)) return false;
    }

    return isSelectedNotificationType(event);
  }

  function isEventFromFollowedUser(event: Nostr.Event): boolean {
    const followListSet = followList.get();
    if (!followListSet) return false;

    if (event.kind !== 9735) {
      return followListSet.has(event.pubkey);
    } else {
      const kind9734 = extractKind9734(event);
      return (kind9734 && followListSet.has(kind9734.pubkey)) || false;
    }
  }

  function isEventAddressedToUser(event: Nostr.Event): boolean {
    const targetPubkey = event.tags.findLast(
      (tag) => tag[0] === "p" && tag.length > 1
    )?.[1];
    return targetPubkey === lumiSetting.get().pubkey;
  }

  function isSelectedNotificationType(event: Nostr.Event): boolean {
    if (!$value || typeof $value === "string") return true;

    return $value.some((selectedType) => {
      const typeConfig = NOTIFICATION_TYPES.find((t) => t.id === selectedType);
      if (!typeConfig) return false;

      return typeConfig.kinds.includes(event.kind);
    });
  }

  // Toggle button handlers
  function selectAllNotificationTypes() {
    value.set(NOTIFICATION_TYPES.map((type) => type.id));
  }

  function clearAllNotificationTypes() {
    value.set([]);
  }

  // Initialization
  async function initializeNotifications() {
    const existingEvents: EventPacket[] | undefined =
      queryClient?.getQueryData(TIMELINE_QUERY);
    if (!filters) return;
    if (!existingEvents || existingEvents.length <= 0) {
      filters[0].since = undefined;
      filters[0].limit = INITIAL_LOAD_LIMIT;
      filters[0].until = now();
    } else {
      filters[0].since = existingEvents[0].event.created_at;
      filters[0].until = now();
    }
  }
</script>

{#if !lumiSetting.get().pubkey && filters}
  <a
    href="/settings"
    class="whitespace-pre-wrap break-words p-2 underline text-magnum-400 hover:opacity-75"
    style="word-break: break-word;"
  >
    {$_("setting.pubkey")}
  </a>
{:else}
  <section>
    <NotificationFilter />

    <div class="w-full break-words overflow-x-hidden">
      <!-- Notification type filter buttons -->
      <div use:melt={$root} class="flex items-center">
        <button
          class="toggle-item relative w-full"
          disabled={$value?.length === NOTIFICATION_TYPES.length}
          onclick={selectAllNotificationTypes}
        >
          All
        </button>

        {#each NOTIFICATION_TYPES as type}
          <button use:melt={$item(type.id)} class="toggle-item relative w-full">
            {#if typeof type.title === "string"}
              {type.title}
            {:else if type.title}
              <type.title />
            {/if}
          </button>
        {/each}

        <button
          class="toggle-item relative w-full"
          disabled={$value?.length === 0}
          onclick={clearAllNotificationTypes}
        >
          None
        </button>
      </div>

      {#if view && filters}
        <NotificationList
          queryKey={TIMELINE_QUERY}
          {filters}
          {viewIndex}
          amount={DISPLAY_AMOUNT}
          eventFilter={getNotificationFilterPredicate}
          bind:updateViewNotifi
        >
          {#snippet children({ events })}
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
                {/each}
              {/if}
            </div>
          {/snippet}
        </NotificationList>
      {/if}
    </div>
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

<style lang="postcss">
  .toggle-item {
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    border-radius: 0;
    background-color: theme("colors.neutral.800");
    color: theme("colors.magnum.200");
    font-weight: 500;
    line-height: 1;
    flex: 1;
    height: theme(spacing.12);
    padding-inline: theme(spacing.2);

    &:focus {
      position: relative;
    }

    &:focus-visible {
      @apply z-10 ring-2;
    }

    &[data-state="active"] {
      @apply focus:relative;
      background-color: theme("colors.magnum.700");
      color: theme("colors.magnum.100");
    }
  }

  .save {
    display: inline-flex;
    height: theme(spacing.8);
    cursor: default;
    align-items: center;
    justify-content: center;
    border-radius: theme(borderRadius.md);
    background-color: theme(colors.magnum.200);
    padding-inline: theme(spacing.4);
    line-height: 1;
    font-weight: theme(fontWeight.semibold);
    color: theme(colors.magnum.900);
    @apply transition;

    &:hover {
      opacity: 0.75;
    }

    &:focus {
      @apply !ring-green-600;
    }
  }

  .toggle-item[data-state="on"] {
    @apply bg-magnum-200 text-magnum-900;
  }

  .toggle-item:disabled {
    @apply bg-magnum-200 text-magnum-900;
  }
</style>

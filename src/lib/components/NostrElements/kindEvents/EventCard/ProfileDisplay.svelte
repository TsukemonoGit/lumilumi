<script lang="ts">
  import { Cake } from "lucide-svelte";
  import DisplayName from "$lib/components/NostrElements/user/DisplayName.svelte";
  import * as nip19 from "nostr-tools/nip19";
  import { checkBirthDay } from "$lib/func/event";
  import { followList } from "$lib/stores/globalRunes.svelte";
  import { profile } from "$lib/func/util";
  import { eventKinds } from "$lib/func/kinds";
  import * as Nostr from "nostr-typedef";

  interface Props {
    pubkey: string;
    metadata?: Nostr.Event | undefined;
    kindInfo?: boolean;
    kind?: number;
  }
  let { pubkey, metadata, kind, kindInfo }: Props = $props();

  let petname = $derived(followList.get().get(pubkey));
  let prof = $derived(profile(metadata));
  let isBirthDay = $derived(checkBirthDay(prof));
  let hasDisplayName = $derived(prof?.display_name && prof.display_name !== "");
  let hasName = $derived(prof?.name && prof.name !== "");
  let hasNip05 = $derived(prof?.nip05 && prof.nip05 !== "");
</script>

{#if petname}
  <span class="text-magnum-100">📛{petname}</span>
{:else if hasDisplayName || hasName || hasNip05}
  {#if hasDisplayName}
    <DisplayName
      height={21}
      name={prof!.display_name!}
      tags={metadata?.tags ?? []}
    />
  {/if}

  {#if hasName}
    <DisplayName
      height={21}
      name={`@${prof!.name}`}
      tags={metadata?.tags ?? []}
    />
  {:else if hasNip05 && !hasDisplayName}
    <span
      class="line-clamp-1 truncate max-w-full overflow-hidden italic"
      style="white-space: normal; word-break: break-word; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1;"
    >
      {prof!.nip05}
    </span>
  {/if}
{:else}
  <span class="text-magnum-100 text-sm break-all">
    {nip19.npubEncode(pubkey)}
  </span>
{/if}

{#if isBirthDay}
  <Cake size={16} class="text-magnum-400 w-[16px]" />
{/if}

{#if kindInfo && kind !== undefined}
  <span class="text-neutral-300/50 text-sm whitespace-nowrap ml-1">
    {eventKinds.get(kind)?.en ?? `kind:${kind}`}
  </span>
{/if}

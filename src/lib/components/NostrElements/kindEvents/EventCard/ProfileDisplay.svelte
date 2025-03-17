<script lang="ts">
  import { Cake } from "lucide-svelte";
  import DisplayName from "$lib/components/NostrElements/user/DisplayName.svelte";
  import { nip19 } from "nostr-tools";
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
</script>

{#if petname}
  <span class="text-magnum-100">📛{petname}</span>
{:else if metadata && prof}
  <span
    class="line-clamp-1 truncate overflow-hidden max-w-full"
    style="white-space: normal; word-break: break-word;"
  >
    <DisplayName
      height={21}
      name={prof.display_name ?? ""}
      tags={metadata.tags}
    />
  </span>
  {#if prof.name && prof.name !== ""}
    <span
      class="text-magnum-100 text-sm line-clamp-1 truncate overflow-hidden max-w-full"
      style="white-space: normal; word-break: break-word;"
    >
      <DisplayName height={21} name={`@${prof.name}`} tags={metadata.tags} />
    </span>
  {/if}
{:else}
  <span class="text-magnum-100 text-sm break-all">
    @{nip19.npubEncode(pubkey)}
  </span>
{/if}
{#if isBirthDay}
  <Cake size={16} class="text-magnum-400 w-[16px]" />
{/if}
{#if kindInfo && kind}
  <span class=" text-neutral-300/50 text-sm whitespace-nowrap ml-1">
    {eventKinds.get(kind)?.en ?? `kind:${kind}`}
  </span>
{/if}

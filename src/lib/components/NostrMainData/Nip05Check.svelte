<script lang="ts">
  import { showImg } from "$lib/stores/stores";
  import { CircleMinus, BadgeAlert, ShieldCheck } from "lucide-svelte";
  import { nip05 } from "nostr-tools";
  export let pubkey: string;
  export let nip05Address: string;
  const size = 16;
  $: isValid = $showImg ? nip05.isValid(pubkey, nip05Address) : undefined;
</script>

{#if !$showImg}
  <CircleMinus {size} class="ml-1 inline-flex text-gray-400 my-auto" />
{:else if !isValid}
  <BadgeAlert {size} class="ml-1 inline-flex text-red-600  my-auto" />
{:else}
  <ShieldCheck {size} class="ml-1 inline-flex text-green-600  my-auto" />
{/if}

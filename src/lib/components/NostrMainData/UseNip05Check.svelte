<script lang="ts">
  import { useNip05Check } from "$lib/func/nip05check";

  export let pubkey: string;
  export let nip05Address: string;
  $: nip05 = useNip05Check(nip05Address, pubkey);
  $: data = nip05.data;

  interface $$Slots {
    default: { nip05: boolean };

    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if $data}
  <slot nip05={$data} />
{:else}
  <slot name="nodata" />
{/if}

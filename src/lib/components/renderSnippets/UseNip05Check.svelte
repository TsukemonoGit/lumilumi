<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot making the component unusable -->
<script lang="ts">
  import { useNip05Check } from "$lib/func/nip05";
  import type { ReqStatus } from "$lib/types";

  interface Props {
    pubkey: string;
    nip05Address: string;
    error?: import("svelte").Snippet<[Error]>;
    nodata?: import("svelte").Snippet;
    loading?: import("svelte").Snippet;

    content?: import("svelte").Snippet<
      [
        {
          nip05: {
            result: boolean;
            error?: string;
          };
          status: ReqStatus;
        },
      ]
    >;
  }

  let { pubkey, nip05Address, loading, error, nodata, content }: Props =
    $props();

  //export let pubkey: string;
  //export let nip05Address: string;
  let nip05 = $derived(useNip05Check(nip05Address, pubkey));
  let data = $derived(nip05.data);
  let status = $derived(nip05.status);
  let errorData = $derived(nip05.error);
  // $: console.log($data);
</script>

{#if $errorData}
  {@render error?.($errorData)}
{:else if $data !== null && $data !== undefined}
  {@render content?.({ nip05: $data, status: $status })}
  <!-- <slot nip05={$data} status={$status} /> -->
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}

<script lang="ts">
  import { showImg } from "$lib/stores/stores";
  import { CircleMinus, BadgeAlert, ShieldCheck, Loader } from "lucide-svelte";
  import UseNip05Check from "./UseNip05Check.svelte";
  export let pubkey: string;
  export let nip05Address: string;
  const size = 16;
</script>

{#if !$showImg}
  <CircleMinus {size} class="ml-1 inline-flex text-gray-400 my-auto" />
{:else}
  <UseNip05Check {pubkey} {nip05Address} let:nip05 let:status>
    <Loader
      slot="loading"
      {size}
      class="ml-1 inline-flex text-gray-400 my-auto"
    />
    <BadgeAlert
      slot="error"
      {size}
      class="ml-1 inline-flex text-red-600  my-auto"
    />
    {#if nip05 === true}<ShieldCheck
        {size}
        class="ml-1 inline-flex text-green-600  my-auto"
      />
    {:else if nip05 === false}
      <BadgeAlert {size} class="ml-1 inline-flex text-red-600  my-auto" />
    {/if}
  </UseNip05Check>
{/if}

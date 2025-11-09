<script lang="ts">
  import { splitHexColorString } from "$lib/func/util";
  import Avatar from "svelte-boring-avatars";
  const size = 42; //96;
  let { handleClickToChannel, linkButtonTitle, id, children, menu } = $props();
</script>

<div class="w-full grid grid-cols-[1fr_auto]">
  <button
    title={linkButtonTitle}
    class="grid grid-cols-[auto_1fr] hover:opacity-75 active:opacity-50"
    onclick={handleClickToChannel}
  >
    <!--がぞう-->

    <Avatar
      {size}
      name={id}
      variant="beam"
      colors={splitHexColorString(id)}
      square={true}
    />

    <!--てきすとたち-->
    <div class="ml-2 text-start flex flex-col">
      <div class="text-xl font-bold text-magnum-400">
        <!--  {channelData.name} -->
      </div>
      {#if children}
        <div class="break-all text-neutral-500 italic">
          {@render children()}
        </div>
      {:else}
        <div
          class="mt-1 w-full flex items-center flex-wrap overflow-hidden h-10 bg-neutral-700 rounded-full"
        ></div>{/if}
    </div></button
  >
  <div class="content-center p-1">
    {@render menu?.()}
  </div>
</div>

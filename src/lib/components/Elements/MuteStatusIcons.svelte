<script lang="ts">
  import { initUserMuteStatus, userMuteStatus } from "$lib/func/util";
  import { mutebykinds, mutes } from "$lib/stores/stores";
  import type { UserMuteStatus } from "$lib/types";
  import { Repeat2, SmilePlus, User, Slash, Zap } from "lucide-svelte";

  export let pubkey: string;

  $: muteStatus =
    $mutes || $mutebykinds ? userMuteStatus(pubkey) : initUserMuteStatus;
  $: existMuteStatus = (
    Object.keys(muteStatus) as Array<keyof UserMuteStatus>
  ).find((key) => muteStatus[key] === true);
</script>

{#if existMuteStatus}
  <div class="flex">
    {#if muteStatus.user}
      <div class="relative mx-1">
        <!-- アイコン部分に取り消し線 -->
        <Slash
          size={16}
          strokeWidth={3}
          class="stroke-2 absolute left-0 right-0 stroke-magnum-400/80 rotate-90"
        />
        <User size={16} class="stroke-neutral-300" />
      </div>{/if}
    {#if muteStatus.repost}
      <div class="relative mx-1">
        <!-- アイコン部分に取り消し線 -->
        <Slash
          strokeWidth={3}
          size={16}
          class=" absolute left-0 right-0 stroke-magnum-400/80 rotate-90"
        />
        <Repeat2 size={16} class="stroke-neutral-300" />
      </div>{/if}
    {#if muteStatus.reaction}
      <div class="relative mx-1">
        <!-- アイコン部分に取り消し線 -->
        <Slash
          size={16}
          strokeWidth={3}
          class="absolute left-0 right-0 stroke-magnum-400/80 rotate-90"
        />
        <SmilePlus size={16} class="stroke-neutral-300" />
      </div>{/if}
    {#if muteStatus.zap}
      <div class="relative mx-1">
        <!-- アイコン部分に取り消し線 -->
        <Slash
          size={16}
          strokeWidth={3}
          class="absolute left-0 right-0 stroke-magnum-400/80 rotate-90"
        />
        <Zap size={16} class="stroke-neutral-300" />
      </div>{/if}
  </div>{/if}

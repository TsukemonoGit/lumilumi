<script lang="ts">
  import Link from "$lib/components/Elements/Link.svelte";
  import { _ } from "svelte-i18n";
  import * as Nostr from "nostr-typedef";
  import { nip19 } from "nostr-tools";
  import {
    loginUser,
    nowProgress,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";
  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";
  import { promisePublishSignedEvent, publishEvent } from "$lib/func/nostr";
  import { nip07Signer, now, type OkPacketAgainstEvent } from "rx-nostr";

  const handleClickCreateKind3 = () => {
    //つくっていいかがめんだしておｋでかきこむ
    $dialogOpen = true;
  };
  let dialogOpen: any;
  const onClickOK = async () => {
    console.log("onClickOK");
    $dialogOpen = false;
    $nowProgress = true;
    const ev: Nostr.EventParameters = {
      kind: 3,
      content: "",
      tags: [["p", $loginUser]],
    };
    const signer = nip07Signer();
    const event = await signer.signEvent(ev);
    if (event.pubkey !== $loginUser) {
      $toastSettings = {
        title: "Error",
        description: "login pubkey ≠ sign pubkey",
        color: "bg-red-500",
      };
      $nowProgress = false;
      return;
    } else {
      const { event: ev, res } = await promisePublishSignedEvent(event);
      const isSuccessRelays: OkPacketAgainstEvent[] = res.filter(
        (item) => item.ok
      );

      if (isSuccessRelays.length <= 0) {
        $toastSettings = {
          title: "Failed",
          description: "failed to publish",
          color: "bg-red-500",
        };
      } else {
        location.reload();
      }
    }
    $nowProgress = false;
  };
</script>

{#if $loginUser}
  <div class="break-all whitespace-pre-wrap">
    {$_("create_kind3.message")}
  </div>
  <button
    on:click={handleClickCreateKind3}
    class=" rounded-md bg-magnum-200 px-3 py-3 font-medium text-magnum-900 hover:opacity-75 active:opacity-50 disabled:opacity-25 mx-auto flex"
    >{$_("create_kind3.create")}</button
  >{/if}
<AlertDialog
  bind:open={dialogOpen}
  {onClickOK}
  title={$_("create_kind3.create")}
  ><div slot="main" class=" text-neutral-200 whitespace-pre-wrap">
    {$_("create_kind3.newMessage")}
  </div></AlertDialog
>

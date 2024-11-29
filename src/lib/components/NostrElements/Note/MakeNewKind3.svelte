<script lang="ts">
  import { _ } from "svelte-i18n";
  import * as Nostr from "nostr-typedef";

  import { loginUser, nowProgress, toastSettings } from "$lib/stores/stores";
  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";
  import { promisePublishSignedEvent } from "$lib/func/nostr";
  import { nip07Signer, type OkPacketAgainstEvent } from "rx-nostr";
  import SampleGlobalLink from "./SampleGlobalLink.svelte";
  import { writable } from "svelte/store";

  const handleClickCreateKind3 = () => {
    //つくっていいかがめんだしておｋでかきこむ
    $dialogOpen = true;
  };
  let dialogOpen: any = writable(false);
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

    <SampleGlobalLink />
  </div>
  <button
    onclick={handleClickCreateKind3}
    class=" rounded-md bg-magnum-200 px-3 py-3 font-medium text-magnum-900 hover:opacity-75 active:opacity-50 disabled:opacity-25 mx-auto flex"
    >{$_("create_kind3.create")}</button
  >{/if}
<AlertDialog open={dialogOpen} {onClickOK} title={$_("create_kind3.create")}
  >{#snippet main()}
    <div class=" text-neutral-200 whitespace-pre-wrap">
      {$_("create_kind3.newMessage")}
      {$_("create_kind3.reload")}
    </div>
  {/snippet}</AlertDialog
>

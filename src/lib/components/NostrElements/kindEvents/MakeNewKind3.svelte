<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";
  import * as Nostr from "nostr-typedef";

  import { nowProgress, queryClient } from "$lib/stores/stores";
  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";
  import { promisePublishSignedEvent, pubkeysIn } from "$lib/func/nostr";
  import { nip07Signer, type OkPacketAgainstEvent } from "rx-nostr";
  import SampleGlobalLink from "./SampleGlobalLink.svelte";
  import { formatToEventPacket } from "$lib/func/util";
  import { followList, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { addToast } from "$lib/components/Elements/Toast.svelte";

  let dialogOpen: boolean = $state(false);

  const handleClickCreateKind3 = () => {
    //つくっていいかがめんだしておｋでかきこむ
    dialogOpen = true;
  };

  const onClickOK = async () => {
    console.log("onClickOK");
    dialogOpen = false;
    $nowProgress = true;
    const ev: Nostr.EventParameters = {
      kind: 3,
      content: "",
      tags: [["p", lumiSetting.get().pubkey]],
    };
    const signer = nip07Signer();
    try {
      const event = await signer.signEvent(ev);
      if (event.pubkey !== lumiSetting.get().pubkey) {
        addToast({
          data: {
            title: "Error",
            description: "login pubkey ≠ sign pubkey",
            color: "bg-red-500",
          },
        });
        $nowProgress = false;
        return;
      } else {
        const { event: ev, res } = await promisePublishSignedEvent(event);
        const isSuccessRelays: OkPacketAgainstEvent[] = res.filter(
          (item) => item.ok
        );

        if (isSuccessRelays.length <= 0) {
          addToast({
            data: {
              title: "Failed",
              description: "failed to publish",
              color: "bg-red-500",
            },
          });
        } else {
          //location.reload();
          queryClient.setQueryData(
            ["timeline", "contacts", lumiSetting.get().pubkey],
            (oldData: any) => formatToEventPacket(ev, isSuccessRelays[0].from)
          );

          const pubkeyList = pubkeysIn(ev);
          followList.set(pubkeyList);
        }
      }
    } catch (error) {
      addToast({
        data: {
          title: "Failed",
          description: "failed to sign event",
          color: "bg-red-500",
        },
      });
    }
    $nowProgress = false;
  };
</script>

{#if lumiSetting.get().pubkey}
  <div class="break-all whitespace-pre-wrap">
    {$_("create_kind3.message")}

    <SampleGlobalLink />
  </div>
  <button
    onclick={handleClickCreateKind3}
    class=" rounded-md bg-magnum-200 px-3 py-3 font-medium text-magnum-900 hover:opacity-75 active:opacity-50 disabled:opacity-25 mx-auto flex"
    >{$_("create_kind3.create")}</button
  >{/if}
<AlertDialog
  id="create_new_kind3"
  bind:open={dialogOpen}
  {onClickOK}
  title={$_("create_kind3.create")}
  >{#snippet main()}
    <div class=" text-neutral-200 whitespace-pre-wrap">
      {$_("create_kind3.newMessage")}
      <!--    {$_("create_kind3.reload")} -->
    </div>
  {/snippet}</AlertDialog
>

<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { UserCog, Pin, RadioTower, User } from "lucide-svelte";
  import { _ } from "svelte-i18n";
  import DropdownMenu from "./DropdownMenu.svelte";

  import { nip19 } from "nostr-tools";

  import { goto } from "$app/navigation";
  interface Props {
    metadata: Nostr.Event;
  }

  let { metadata }: Props = $props();

  const menuTexts = [
    { text: `${$_("user.profileEdit")}`, icon: User, num: 0 },

    { text: `${$_("settings.kind10002")}`, icon: RadioTower, num: 2 },
    { text: `${$_("settings.nostviewstr.kind10001")}🔗`, icon: Pin, num: 1 },
  ];

  const handleSelectItem = async (index: number) => {
    const encodedPub = nip19.npubEncode(metadata.pubkey);

    switch (menuTexts[index].num) {
      case 0:
        //edit profile
        goto(`${nip19.npubEncode(metadata.pubkey)}/profile`);
        break;

      case 1:
        //edit pin

        const url = `https://nostviewstr.vercel.app/${encodedPub}/10001`;

        window.open(url, "_blank", "noreferrer");
        break;

      case 2:
        // const url2 = `https://nostviewstr.vercel.app/${encodedPub}/10002`;

        //  window.open(url2, "_blank", "noreferrer");
        //edit relays まだ
        goto(`${encodedPub}/relays`);
        break;
    }
  };
</script>

<DropdownMenu {menuTexts} {handleSelectItem}>
  <div
    class="w-fit rounded-full bg-neutral-200 text-magnum-600 p-1 hover:opacity-75 active:opacity-50"
    title="user setting"
  >
    <UserCog />
  </div></DropdownMenu
>

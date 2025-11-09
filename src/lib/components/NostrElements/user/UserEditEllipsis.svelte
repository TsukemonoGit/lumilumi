<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { UserCog, Pin, RadioTower, User } from "lucide-svelte";
  import { t as _ } from "@konemono/svelte5-i18n";

  import * as nip19 from "nostr-tools/nip19";

  import { goto } from "$app/navigation";
  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import type { MenuGroup } from "$lib/types";
  interface Props {
    pubkey: string;
  }

  let { pubkey }: Props = $props();

  const menuGroups: MenuGroup[] = [
    {
      // label は不要なので省略
      items: [
        {
          text: `${$_("user.profileEdit")}`,
          icon: User,
          action: "editProfile",
        },

        {
          text: `${$_("settings.kind10002")}`,
          icon: RadioTower,
          action: "editRelay",
        },
      ],
    },
  ];

  const handleSelectItem = async (action: string) => {
    const encodedPub = nip19.npubEncode(pubkey);

    switch (action) {
      case "editProfile":
        //edit profile
        goto(`${nip19.npubEncode(pubkey)}/profile`);
        break;

      case "editRelay":
        goto(`${encodedPub}/relays`);
        break;
    }
  };
</script>

<DropdownMenu {menuGroups} {handleSelectItem}>
  <div
    class="w-fit rounded-full bg-neutral-200 text-magnum-600 p-1 hover:opacity-75 active:opacity-50"
    title="user setting"
  >
    <UserCog />
  </div></DropdownMenu
>

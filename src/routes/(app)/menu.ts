import { page } from "$app/state";
import {
  Bell,
  Globe,
  House,
  MessagesSquare,
  Search,
  Settings,
  TrendingUp,
  Users,
} from "lucide-svelte";

export const mainMenuItems: {
  Icon: any;
  link: string | undefined;
  alt: string;
  noPubkey: boolean; //Pubkey設定してないときもクリックできるメニューか？
}[] = [
  {
    Icon: House,
    link: "/",
    alt: "home",
    noPubkey: true,
  },
  {
    Icon: Bell,
    link: "/notifications",
    alt: "notifications",
    noPubkey: false,
  },
  {
    Icon: Search,
    link: "/search",
    alt: "search",
    noPubkey: true,
  },
  {
    Icon: Globe,
    link: "/global",
    alt: "global",
    noPubkey: true,
  },
  {
    Icon: MessagesSquare,
    link: "/channel",
    alt: "channel",
    noPubkey: true,
  },
  {
    Icon: Users,
    link: "/list",
    alt: "list",
    noPubkey: false,
  },
  { Icon: undefined, link: undefined, alt: "profile", noPubkey: false },
  {
    Icon: TrendingUp,
    link: undefined,
    alt: "edit status",
    noPubkey: true,
  },
  {
    Icon: Settings,
    link: "/settings",
    alt: "settings",
    noPubkey: true,
  },
];

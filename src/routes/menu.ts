import { page } from "$app/stores";
import {
  AlignJustify,
  Bell,
  Globe,
  House,
  MessagesSquare,
  Search,
  Settings,
  TrendingUp,
  Users,
  X,
} from "lucide-svelte";
import { derived } from "svelte/store";
import Logo from "$lib/images/favicon.svg";

export const items: {
  Icon: any;
  link: string;
  alt: string;
}[] = [
  { Icon: House, link: "/", alt: "home" },
  { Icon: Bell, link: "/notifications", alt: "notifications" },
  { Icon: Search, link: "/search", alt: "search" },
  { Icon: Globe, link: "/global", alt: "global" },
  { Icon: MessagesSquare, link: "/channel", alt: "channel" },
  { Icon: Users, link: "/list", alt: "list" },

  { Icon: Settings, link: "/settings", alt: "settings" },
  // {
  //   Icon: UserAvatar2,
  //   link: undefined,
  //   alt: "user page",
  // },
];

// 現在のページに基づいてアイコンを設定
export const currentPage = derived(page, ($page) => {
  const { pathname } = $page.url;
  // アイテムを部分一致でチェック
  const matchedItem = items.find((item) => {
    if (item.link === "/" && pathname === "/") return true;

    if (item.link !== "/" && pathname.startsWith(item.link)) return true;

    return false;
  });

  return matchedItem || null;
});

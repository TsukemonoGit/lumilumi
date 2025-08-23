import { Heart, Repeat2, Reply, Zap } from "lucide-svelte";
import { notificationKinds } from "$lib/func/constants";

export type NotificationType = {
  id: string;
  title: any;
  kinds: number[];
};

// Base notification types
const BASE_NOTIFICATION_TYPES: NotificationType[] = [
  { id: "reaction", title: Heart, kinds: [7] },
  { id: "reply", title: Reply, kinds: [1] },
  { id: "repost", title: Repeat2, kinds: [6, 16] },
  { id: "zap", title: Zap, kinds: [9735] },
];

// Covered kinds
const coveredKinds = BASE_NOTIFICATION_TYPES.flatMap((t) => t.kinds);

// Other kinds
const otherKinds = notificationKinds.filter((k) => !coveredKinds.includes(k));

// Complete set
export const NOTIFICATION_TYPES: NotificationType[] = [
  ...BASE_NOTIFICATION_TYPES,
  { id: "other", title: "other", kinds: otherKinds },
];

// 初期値オブジェクト
export const notifiInit = {
  onlyFollowee: false,
  selects: NOTIFICATION_TYPES.map((t) => t.id),
};

import {
  QueryClient,
  type QueryClientConfig,
  type QueryKey,
} from "@tanstack/svelte-query";
import { writable } from "svelte/store";
import {
  type RxNostr,
  type EventPacket,
  type DefaultRelayConfig,
  type EventVerifier,
} from "rx-nostr";
import {
  // timelineFilterInit,
  type AdditionalPostOptions,
  type LumiEmoji,
  type LumiMute,
  type LumiMuteByKind,
  //type TimelineFilter,
} from "$lib/types";
//import * as Nostr from "nostr-typedef";
import { type OperatorFunction } from "rxjs";
//import type { Part } from "$lib/func/content";

const config: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 3 * 60 * 60 * 1000, //60 * 10 * 1000, //30分　キャッシュされたデータがstateTimeを超えたら新しいデータを取得しようとするが再フェッチが∞なので手動で再フェッチしないと更新されない。また再フェッチで更新されるデータはstaleTimeを過ぎたデータだけ。
      refetchInterval: Infinity,
      gcTime: 3 * 60 * 60 * 1000, //1時間　クエリがまだ使用されている間は何もしません。クエリが使用されなくなった時点でキャッシュが開始されます。時間が経過すると、キャッシュが大きくならないようにデータは "ガベージコレクション "されます。
      //ガベージコレクション（garbage collection）とは、コンピュータプログラムの実行環境などが備える機能の一つで、実行中のプログラムが占有していたメモリ領域のうち不要になったものを自動的に解放し、空き領域として再利用できるようにするもの。そのような処理を実行するプログラムを「ガベージコレクタ」（garbage collector）という。// Rename `cacheTime` to `gcTime`
      //https://github.com/TanStack/query/blob/a300d484750edb4b64bdefcc86abaac305d73b13/docs/framework/react/guides/migrating-to-v5.md#rename-cachetime-to-gctime
    },
  },
};
export const metadataQueue = writable<[QueryKey, EventPacket][]>([]);
export const queryClient = new QueryClient(config);

export const app = writable<{ rxNostr: RxNostr; rxNostr3: RxNostr }>();

export const toastSettings = writable<{
  title: string;
  description: string;
  color: string;
}>();

export const loginUser = writable<string>();
// export const showImg = writable<boolean>(false);
// export const showPreview = writable<boolean>(false);
// export const menuLeft = writable<boolean>(false);
//export const showKind16 = writable<boolean>(false);
// export const showRelayIcon = writable<boolean>(false);
// export const defaultReaction = writable<{ content: string; tag: string[] }>({
//   content: "+",
//   tag: [],
// });
//export const showReactioninTL = writable<boolean>(true);
//export const showUserStatus = writable<boolean>();
//export const addClientTag = writable<boolean>(false);
// export const kind42inTL = writable<boolean>(false);
// export const showAllReactions = writable<boolean>(false);

export const defaultRelays = writable<Record<string, DefaultRelayConfig>>();

export const emojis = writable<LumiEmoji>();
export const mutes = writable<LumiMute>();

export const mutebykinds = writable<LumiMuteByKind>();

export const nowProgress = writable<boolean>(false);

//export const tieMapStore = writable<Map<string, Set<string>>>();
export const tieMapStore = writable<{
  [key: string]:
    | [
        OperatorFunction<
          EventPacket,
          EventPacket & {
            seenOn: Set<string>;
            isNew: boolean;
          }
        >,
        Map<string, Set<string>>
      ];
}>();

export const uploader = writable<string>();

export const postWindowOpen = writable<boolean>();

export const additionalPostOptions = writable<
  AdditionalPostOptions | undefined
>(); //投稿したあとでundefinedにする

//export const verifier = writable<EventVerifier>();

export const relayIconErrorStore = writable<string[]>([]);

export const viewMediaModal = writable<{
  index: number;
  mediaList: string[];
}>();

export const onlyFollowee = writable<boolean>(false);
//export const reactionList = writable<Nostr.Event[]>([]);
export const reactionToast = writable<{
  title: string;
  description: string;
  color: string;
}>();

export const ogTitle = writable<string>("Lumilumi");

export const ogDescription = writable<string>("the nostr client");

import {
  QueryClient,
  type QueryClientConfig,
  type QueryKey,
} from "@tanstack/svelte-query";
import { writable, type Writable } from "svelte/store";
import {
  type RxNostr,
  type EventPacket,
  type DefaultRelayConfig,
  type ConnectionState,
  type EventVerifier,
} from "rx-nostr";
import type {
  AdditionalPostOptions,
  LumiEmoji,
  LumiMute,
  LumiMuteByKind,
} from "$lib/types";
import * as Nostr from "nostr-typedef";
import { type OperatorFunction } from "rxjs";
import type { Part } from "$lib/func/content";

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
export const queryClient = writable(new QueryClient(config));

export const app = writable<{ rxNostr: RxNostr; rxNostr3: RxNostr }>();

export const toastSettings = writable<{
  title: string;
  description: string;
  color: string;
}>();

export const loginUser = writable<string>();

export const showImg = writable<boolean>(false);
export const showPreview = writable<boolean>(false);
export const menuLeft = writable<boolean>(false);
export const defaultRelays = writable<Record<string, DefaultRelayConfig>>();
export const emojis = writable<LumiEmoji>();
export const mutes = writable<LumiMute>();
export const mutebykinds = writable<LumiMuteByKind>();
export const nowProgress = writable<boolean>(false);

export const viewEventIds = writable<string[][]>([]);

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

// export let openPostWindow:
//   | {
//       update: (
//         updater: import("svelte/store").Updater<boolean>,
//         sideEffect?: ((newValue: boolean) => void) | undefined
//       ) => void;
//       set: (this: void, value: boolean) => void;
//       subscribe(
//         this: void,
//         run: import("svelte/store").Subscriber<boolean>,
//         invalidate?: import("svelte/store").Invalidator<boolean> | undefined
//       ): import("svelte/store").Unsubscriber;
//       get: () => boolean;
//       destroy?: (() => void) | undefined;
//     }
//   | undefined;

export const uploader = writable<string>();
export const showRelayIcon = writable<boolean>(false);
export const slicedEvent = writable<Nostr.Event[]>();
export const defaultReaction = writable<{ content: string; tag: string[] }>({
  content: "+",
  tag: [],
});

export const showReactioninTL = writable<boolean>(true);

export const nostrWalletConnect = writable<string>("");

export const postWindowOpen = writable<boolean>();
export const additionalPostOptions = writable<
  AdditionalPostOptions | undefined
>(); //投稿したあとでundefinedにする
export const showUserStatus = writable<boolean>();
export const relayStateMap = writable<Map<string, ConnectionState>>(
  new Map<string, ConnectionState>()
);
// export const relayStateMap3 = writable<Map<string, ConnectionState>>(
//   new Map<string, ConnectionState>()
// );

export const verifier = writable<EventVerifier>();

export const relayIconErrorStore = writable<string[]>([]);
export const showBanner = writable<boolean>(false);
export const viewMediaModal = writable<{ index: number; mediaList: Part[] }>();
export const showKind16 = writable<boolean>(false);
export const onlyFollowee = writable<boolean>(false);
//export const reactionList = writable<Nostr.Event[]>([]);
export const reactionToast = writable<{
  title: string;
  description: string;
  color: string;
}>();

export const addClientTag = writable<boolean>(false);
export const showClientTag = writable<boolean>(true);
export const followList: Writable<Map<string, string | undefined>> = writable<
  Map<string, string | undefined>
>(new Map());

export const userStatusStore: Writable<Map<string, Map<string, Nostr.Event>>> =
  writable<Map<string, Map<string, Nostr.Event>>>(new Map());

export const showAllReactions = writable<boolean>(false);

export const ogTitle = writable<string>("Lumilumi");

export const ogDescription = writable<string>("the nostr client");

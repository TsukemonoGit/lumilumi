import {
  QueryClient,
  type QueryClientConfig,
  type QueryKey,
} from "@tanstack/svelte-query";
import { get, writable } from "svelte/store";
import {
  type RxNostr,
  type EventPacket,
  type DefaultRelayConfig,
} from "rx-nostr";
import type { MuteList } from "$lib/types";
import * as Nostr from "nostr-typedef";
const config: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: Infinity, //60 * 10 * 1000, //30分　キャッシュされたデータがstateTimeを超えたら新しいデータを取得しようとするが再フェッチが∞なので手動で再フェッチしないと更新されない。また再フェッチで更新されるデータはstaleTimeを過ぎたデータだけ。
      refetchInterval: Infinity,
      gcTime: 60 * 30 * 1000, //1時間　クエリがまだ使用されている間は何もしません。クエリが使用されなくなった時点でキャッシュが開始されます。時間が経過すると、キャッシュが大きくならないようにデータは "ガベージコレクション "されます。
      //ガベージコレクション（garbage collection）とは、コンピュータプログラムの実行環境などが備える機能の一つで、実行中のプログラムが占有していたメモリ領域のうち不要になったものを自動的に解放し、空き領域として再利用できるようにするもの。そのような処理を実行するプログラムを「ガベージコレクタ」（garbage collector）という。// Rename `cacheTime` to `gcTime`
      //https://github.com/TanStack/query/blob/a300d484750edb4b64bdefcc86abaac305d73b13/docs/framework/react/guides/migrating-to-v5.md#rename-cachetime-to-gctime
    },
  },
};
export const metadataQueue = writable<[QueryKey, EventPacket][]>([]);
export const queryClient = writable(new QueryClient(config));

export const app = writable<{ rxNostr: RxNostr }>();

export const toastSettings = writable<{
  title: string;
  description: string;
  color: string;
}>();

export const loginUser = writable<string>();

export const showImg = writable<boolean>(false);
export const showPreview = writable<boolean>(false);
export const defaultRelays = writable<Record<string, DefaultRelayConfig>>();
export const emojis = writable<string[][]>();
export const mutes = writable<MuteList | undefined>();
export const mutebykinds = writable<{ kind: number; list: string[] }[]>([]);
export const nowProgress = writable<boolean>(false);

export const viewEventIds = writable<string[]>([]);

export const tieMapStore = writable<Map<string, Set<string>>>();

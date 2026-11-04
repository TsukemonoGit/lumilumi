import { expect, test, vi } from "vitest";
import { Subject } from "rxjs";
import { get } from "svelte/store";
import type { EventPacket, RxNostr } from "rx-nostr";
import { app } from "$lib/stores/stores";
import { useReq } from "./useReq";
const mocks = vi.hoisted(() => ({
  queryClient: { setQueryData: vi.fn() },
}));
vi.mock("@tanstack/svelte-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/svelte-query")>(
    "@tanstack/svelte-query",
  );
  const { writable } = await import("svelte/store");
  return {
    ...actual,
    useQueryClient: () => mocks.queryClient,
    createQuery: (options: {
      queryFn: () => Promise<EventPacket | EventPacket[] | null>;
    }) => {
      const query = writable<{
        data: EventPacket | EventPacket[] | null | undefined;
        isSuccess: boolean;
      }>({
        data: undefined,
        isSuccess: false,
      });
      void options.queryFn().then((data) => {
        query.set({ data, isSuccess: true });
      });
      return query;
    },
  };
});
const packet = {
  from: "wss://relay.example",
  event: {
    id: "event-id",
    pubkey: "pubkey",
    created_at: 1,
    kind: 1,
    tags: [],
    content: "test",
    sig: "signature",
  },
} satisfies EventPacket;
function setup() {
  const packets = new Subject<EventPacket>();
  const rxNostr = {
    getDefaultRelays: () => ({ "wss://relay.example": {} }),
    use: () => packets,
  } as unknown as RxNostr;
  app.set({ rxNostr, rxNostr3: rxNostr });
  const result = useReq({
    queryKey: ["useReq-test"],
    filters: [],
    operator: (source) => source,
  });
  return { packets, result };
}
test("イベント受信直後にcompleteしても、data反映前はloadingのまま", async () => {
  const { packets, result } = setup();
  packets.next(packet);
  packets.complete();
  expect(get(result.status)).toBe("loading");
  await vi.waitFor(() => {
    expect(get(result.status)).toBe("success");
  });
  expect(get(result.data)).toEqual(packet);
});
test("イベントなしでcompleteした場合はsuccessとnullになる", async () => {
  const { packets, result } = setup();
  packets.complete();
  expect(get(result.status)).toBe("loading");
  await vi.waitFor(() => {
    expect(get(result.status)).toBe("success");
  });
  expect(get(result.data)).toBeNull();
});
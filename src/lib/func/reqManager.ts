import {
  createQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/svelte-query";
import type {
  EventPacket,
  RxReq,
  RxReqOverable,
  RxReqPipeable,
} from "rx-nostr";
import { createRxBackwardReq, tie } from "rx-nostr";
import { derived, writable, get, type Readable } from "svelte/store";
import { Observable, Subscription } from "rxjs";
import { app } from "$lib/stores/stores.js";
import { muteCheck, metadata } from "$lib/stores/operators";
import type { ReqStatus, RxReqBase, UseReqOpts } from "$lib/types";
import type { Filter } from "nostr-typedef";
import * as Nostr from "nostr-typedef";
import { type OperatorFunction } from "rxjs";

class ReqManager {
  private queryClient = useQueryClient();
  private rxNostr = get(app).rxNostr;
  private req:
    | RxReqBase
    | (RxReq<"backward"> & {
        emit(
          filters: Filter | Filter[],
          options?:
            | {
                relays: string[];
              }
            | undefined
        ): void;
      } & RxReqOverable &
        RxReqPipeable);
  private subscription: Subscription | null = null;
  private status = writable<ReqStatus>("loading");
  private error = writable<Error>();
  public data: Readable<EventPacket[] | undefined>;
  public statusDerived;
  public errorDerived;

  constructor(
    private queryKey: QueryKey,
    private filters: Nostr.Filter[],
    private operator: OperatorFunction<
      EventPacket,
      EventPacket | EventPacket[]
    >,
    req:
      | RxReqBase
      | (RxReq<"backward"> & {
          emit(
            filters: Filter | Filter[],
            options?:
              | {
                  relays: string[];
                }
              | undefined
          ): void;
        } & RxReqOverable &
          RxReqPipeable)
      | undefined = undefined,
    private initData: EventPacket | EventPacket[] | undefined = undefined,
    private relay: string[] | undefined = undefined
  ) {
    if (!this.queryClient) {
      throw new Error("QueryClient not found");
    }

    if (Object.entries(this.rxNostr.getDefaultRelays()).length <= 0) {
      console.log("error");
      throw new Error("No relays found");
    }

    this.req = req ? req : createRxBackwardReq();
    this.data = this.createQueryData();
    this.statusDerived = this.createStatusDerived();
    this.errorDerived = this.createErrorDerived();
    this.initializeQuery();
  }

  private createQueryData(): Readable<EventPacket[] | undefined> {
    return derived(
      createQuery({
        queryKey: this.queryKey,
        queryFn: (): Promise<EventPacket[]> => {
          return new Promise((resolve, reject) => {
            let fulfilled = false;
            const obs: Observable<EventPacket | EventPacket[]> = this.rxNostr
              .use(this.req, { relays: this.relay })
              .pipe(get(app).tie, muteCheck(), metadata(), this.operator);

            this.subscription = obs.subscribe({
              next: (v: EventPacket | EventPacket[]) => {
                if (fulfilled) {
                  this.queryClient.setQueryData(this.queryKey, v);
                } else {
                  resolve(Array.isArray(v) ? v : [v]);
                  fulfilled = true;
                  console.log(v);
                }
              },
              complete: () => this.status.set("success"),
              error: (e) => {
                console.error("[rx-nostr]", e);
                this.status.set("error");
                this.error.set(e);
                if (!fulfilled) {
                  reject(e);
                  fulfilled = true;
                }
              },
            });
            this.req.emit(this.filters);
          });
        },
      }),
      ($query) => $query.data as EventPacket[] | undefined
    );
  }

  private createStatusDerived() {
    return derived([this.data, this.status], ([$data, $status]) => {
      if ($data !== undefined) {
        return "success";
      } else {
        return $status;
      }
    });
  }

  private createErrorDerived() {
    return derived([this.data, this.error], ([$data, $error]) => {
      if ($data === undefined && $error) {
        return $error;
      } else {
        return undefined;
      }
    });
  }

  private initializeQuery() {
    this.req.emit(this.filters);
  }

  public stop() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  public updateFilters(newFilters: any) {
    this.filters = newFilters;
    this.req.emit(this.filters);
  }
}

export function createReqManager(
  options: UseReqOpts<EventPacket | EventPacket[]>,
  relay?: string[]
): ReqManager {
  return new ReqManager(
    options.queryKey,
    options.filters,
    options.operator,
    options.req,
    options.initData,
    relay
  );
}

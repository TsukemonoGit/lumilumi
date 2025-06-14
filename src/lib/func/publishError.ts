import type { OkPacketAgainstEvent } from "rx-nostr";
import { promisePublishEvent } from "./nostr";
import * as Nostr from "nostr-typedef";

export class SigningError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "SigningError";
  }
}

export const handlePublishError = (
  error: any
): { errorCode: string; isCanceled: boolean } => {
  if (error instanceof SigningError && error.code === "INVALID_SIZE") {
    return { errorCode: "signError.eventSize", isCanceled: false };
  } else if (error instanceof SigningError && error.code === "USER_REJECTED") {
    return { errorCode: "signError.cancel", isCanceled: true };
  } else if (error instanceof SigningError && error.code === "SIGNING_FAILED") {
    return { errorCode: "signError.signFailed", isCanceled: false };
  }

  return { errorCode: "signError.publishFailed", isCanceled: false };
};

export const safePublishEvent = async (
  eventParams: Nostr.EventParameters,
  relays?: string[] | undefined
): Promise<
  | { event: Nostr.Event; res: OkPacketAgainstEvent[] }
  | { errorCode: string; isCanceled: boolean }
> => {
  try {
    return await promisePublishEvent(eventParams, relays);
  } catch (error) {
    return handlePublishError(error);
  }
};

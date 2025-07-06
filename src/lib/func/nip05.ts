// nip05.ts
import { createQuery } from "@tanstack/svelte-query";
import { derived, writable, type Readable, type Writable } from "svelte/store";
import type { QueryClient } from "@tanstack/svelte-query";
import { NIP05_REGEX } from "nostr-tools/nip05";
import type { ReqStatus, Profile } from "$lib/types";
import * as Nostr from "nostr-typedef";

/**
 * NIP-05検証結果の型定義
 */
export interface Nip05ValidationResult {
  result: boolean;
  error?: string;
}

/**
 * NIP-05検証のエラータイプ
 */
export const NIP05_ERROR_TYPES = {
  FORMAT_ERROR: "formatError",
  FETCH_RESPONSE_ERROR: "fetchResponseError",
  NO_PUBKEY: "noPubkey",
  IMPERSONATION: "impersonation",
  CORS_ERROR: "corsError",
  FETCH_ERROR: "fetchError",
} as const;

/**
 * NIP-05の検証を行う基本関数
 */
async function validateNip05(
  pubkey: string,
  nip05Address: string
): Promise<Nip05ValidationResult> {
  const match = nip05Address.match(NIP05_REGEX);
  if (!match) {
    return { result: false, error: NIP05_ERROR_TYPES.FORMAT_ERROR };
  }

  const [, name = "_", domain] = match;
  const url = `https://${domain}/.well-known/nostr.json?name=${name}`;

  try {
    const res = await fetch(url, { redirect: "manual" });

    if (res.status !== 200) {
      return { result: false, error: NIP05_ERROR_TYPES.FETCH_RESPONSE_ERROR };
    }

    const json = await res.json();
    const registeredPubkey = json.names[name];

    if (!registeredPubkey) {
      return { result: false, error: NIP05_ERROR_TYPES.NO_PUBKEY };
    }

    return {
      result: registeredPubkey === pubkey,
      error:
        registeredPubkey === pubkey
          ? undefined
          : NIP05_ERROR_TYPES.IMPERSONATION,
    };
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      return { result: false, error: NIP05_ERROR_TYPES.CORS_ERROR };
    }
    return { result: false, error: NIP05_ERROR_TYPES.FETCH_ERROR };
  }
}

/**
 * クエリキーを生成する関数
 */
function generateQueryKey(
  pubkey: string,
  nip05Address: string
): readonly [string, string, string] {
  return ["nip05", pubkey, nip05Address.toLowerCase()] as const;
}

/**
 * Svelte Query を使用したNIP-05検証フック
 */
export const useNip05Check = (
  nip05Address: string,
  pubkey: string
): {
  data: Readable<Nip05ValidationResult | undefined | null>;
  status: Writable<ReqStatus>;
  error: Readable<Error>;
} => {
  const status = writable<ReqStatus>("loading");
  const error = writable<Error>();

  const query = createQuery({
    queryKey: generateQueryKey(pubkey, nip05Address),
    queryFn: () => validateNip05(pubkey, nip05Address),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const data = derived(
    query,
    ($query) => {
      if ($query.status === "pending") {
        status.set("loading");
      } else if ($query.status === "success") {
        status.set("success");
      } else if ($query.status === "error") {
        status.set("error");
        const errorMessage =
          $query.error?.message === NIP05_ERROR_TYPES.CORS_ERROR
            ? new Error(
                "CORSエラーが発生しました。APIのドメインがCORSをサポートしているか確認してください。"
              )
            : $query.error;
        error.set(errorMessage);
      }
      return $query.data;
    },
    null
  );

  return {
    data,
    status,
    error,
  };
};

/**
 * Promise ベースのNIP-05検証関数
 */
export const useNip05PromiseCheck = async (
  nip05Address: string,
  pubkey: string
): Promise<Nip05ValidationResult> => {
  return await validateNip05(pubkey, nip05Address);
};

/**
 * キャッシュを考慮したNIP-05検証関数
 */
async function validateNip05WithCache(
  nip05: string,
  pubkey: string,
  queryClient: QueryClient
): Promise<string | undefined> {
  const queryKey = generateQueryKey(pubkey, nip05);

  // キャッシュから既存の検証結果を取得
  const cachedData: Nip05ValidationResult | undefined =
    queryClient.getQueryData(queryKey);

  if (cachedData && cachedData.result) {
    return nip05;
  }

  // キャッシュにない場合は新たに検証
  const validationData = await validateNip05(pubkey, nip05);

  // 結果をキャッシュに保存
  queryClient.setQueryData(queryKey, validationData);

  return validationData.result ? nip05 : undefined;
}

/**
 * nip05文字列から検証済みnip05アドレスを取得する
 */
export async function getNip05Address(
  nip05: string | undefined,
  pubkey: string,
  queryClient: QueryClient
): Promise<string | undefined> {
  if (!nip05) {
    return undefined;
  }

  return await validateNip05WithCache(nip05, pubkey, queryClient);
}

/**
 * プロフィールから検証済みnip05アドレスを取得する
 */
export async function getNip05FromProfile(
  profile: Profile | undefined,
  pubkey: string,
  queryClient: QueryClient
): Promise<string | undefined> {
  const nip05 = profile?.nip05;
  return await getNip05Address(nip05, pubkey, queryClient);
}

/**
 * メタデータから検証済みnip05アドレスを取得する
 */
export async function getNip05FromMetadata(
  metadata: Nostr.Event | undefined,
  queryClient: QueryClient
): Promise<string | undefined> {
  if (!metadata) {
    return undefined;
  }

  try {
    const content = JSON.parse(metadata.content);
    const nip05 = content.nip05;
    return await getNip05Address(nip05, metadata.pubkey, queryClient);
  } catch (error) {
    console.error("Failed to parse metadata content:", error);
    return undefined;
  }
}

import type { DecodedGeohash } from "$lib/types";
import { createQuery } from "@tanstack/svelte-query";
import { derived } from "svelte/store";

export type Geohash = {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string; // You might want to consider using `number` if you prefer
  lon: string; // Same as above
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  address: {
    tourism: string;
    road: string;
    neighbourhood: string;
    city: string;
    province: string;
    ISO3166_2_lvl4: string;
    postcode: string;
    country: string;
    country_code: string;
  };
  boundingbox: [string, string, string, string]; // Adjust to number[] if you prefer
};

export const useGeohash = (geohash: string, decoded: DecodedGeohash) => {
  const genQueryKey = () => ["geohash", geohash] as const;

  const query = createQuery({
    queryKey: genQueryKey(),
    queryFn: () => fetchGeohashContent(decoded),
    staleTime: 1 * 60 * 60 * 1000, // 1 hour
    gcTime: 1 * 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    data: derived(query, ($query) => $query.data, null),
  };
};

export const fetchGeohashContent = async (
  decoded: DecodedGeohash
): Promise<Geohash | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${decoded.latitude}&lon=${decoded.longitude}&format=json`
    ).catch((err) => console.log(err));
    const result = (await response
      ?.json()
      .catch((err) => console.log(err))) as Geohash;
    console.log(result);
    // APIエンドポイントから取得したOGP情報を返す
    return result;
  } catch (error) {
    console.log(error);

    return null;
  }
};

export function decodeGeohash(geohash: string): DecodedGeohash {
  const base32 = "0123456789bcdefghjkmnpqrstuvwxyz";
  let even = true;
  let lat = [-90.0, 90.0];
  let lon = [-180.0, 180.0];

  // 範囲の更新処理を共通化
  const updateRange = (range: number[], bit: number) => {
    const mid = (range[0] + range[1]) / 2;
    bit ? (range[0] = mid) : (range[1] = mid);
  };

  for (const char of geohash) {
    const bits = base32.indexOf(char);

    for (let i = 4; i >= 0; i--) {
      const bit = (bits >> i) & 1;
      even ? updateRange(lon, bit) : updateRange(lat, bit);
      even = !even;
    }
  }

  // 緯度と経度の中央値を計算して返す
  return {
    latitude: (lat[0] + lat[1]) / 2,
    longitude: (lon[0] + lon[1]) / 2,
  };
}

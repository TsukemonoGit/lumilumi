import type { DecodedGeohash } from "$lib/types";
import { createQuery } from "@tanstack/svelte-query";
import { latLng, type LatLngExpression } from "leaflet";
import { derived } from "svelte/store";

// Constants
const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
const GEOHASH_QUERY_STALE_TIME = 60 * 60 * 1000; // 1 hour in ms
const GEOHASH_QUERY_GC_TIME = 60 * 60 * 1000; // 1 hour in ms

/**
 * Represents address data from Nominatim API
 */
export interface GeohashAddress {
  tourism?: string;
  road?: string;
  neighbourhood?: string;
  city?: string;
  province?: string;
  ISO3166_2_lvl4?: string;
  postcode?: string;
  country: string;
  country_code: string;
  [key: string]: string | undefined; // Allow for additional address fields
}

/**
 * Represents geohash location data from Nominatim API
 */
export interface Geohash {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  address: GeohashAddress;
  boundingbox: [string, string, string, string];
}

/**
 * Hook to fetch and access geohash data
 * @param geohash - The geohash string
 * @param decoded - Decoded geohash coordinates
 */
export const useGeohash = (geohash: string, decoded: DecodedGeohash) => {
  const genQueryKey = () => ["geohash", geohash] as const;

  const query = createQuery({
    queryKey: genQueryKey(),
    queryFn: () => fetchGeohashContent(decoded),
    staleTime: GEOHASH_QUERY_STALE_TIME,
    gcTime: GEOHASH_QUERY_GC_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    data: derived(query, ($query) => $query.data, null),
    isLoading: derived(query, ($query) => $query.isLoading, false),
    isError: derived(query, ($query) => $query.isError, false),
    error: derived(query, ($query) => $query.error, null),
  };
};

/**
 * Fetches location data from Nominatim based on coordinates
 * @param decoded - Decoded geohash coordinates
 * @returns Promise resolving to Geohash data or null if error
 */
export const fetchGeohashContent = async (
  decoded: DecodedGeohash
): Promise<Geohash | null> => {
  const { latitude, longitude } = decoded;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const result = (await response.json()) as Geohash;
    return result;
  } catch (error) {
    console.error("Error fetching geohash content:", error);
    return null;
  }
};

/**
 * Decodes a geohash string into latitude and longitude
 * @param geohash - The geohash string to decode
 * @returns Decoded coordinates
 */
export function decodeGeohash(geohash: string): DecodedGeohash {
  let even = true;
  let lat = [-90.0, 90.0];
  let lon = [-180.0, 180.0];

  // Update range based on bit value
  const updateRange = (range: number[], bit: number): void => {
    const mid = (range[0] + range[1]) / 2;
    bit ? (range[0] = mid) : (range[1] = mid);
  };

  for (const char of geohash) {
    const charIndex = BASE32.indexOf(char);

    if (charIndex === -1) {
      throw new Error(`Invalid geohash character: ${char}`);
    }

    for (let i = 4; i >= 0; i--) {
      const bit = (charIndex >> i) & 1;
      even ? updateRange(lon, bit) : updateRange(lat, bit);
      even = !even;
    }
  }

  return {
    latitude: (lat[0] + lat[1]) / 2,
    longitude: (lon[0] + lon[1]) / 2,
  };
}

/**
 * Gets current geolocation from browser
 * @returns Promise resolving to GeolocationPosition
 */
export function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => reject(new Error(`Geolocation error: ${error.message}`)),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

/**
 * Encodes latitude and longitude into a geohash
 * @param lat - Latitude
 * @param lng - Longitude
 * @param precision - Desired precision (1-12)
 * @returns Geohash string
 */
export function encodeGeohash(
  lat: number,
  lng: number,
  precision: number = 10
): string {
  if (precision < 1 || precision > 12) {
    throw new Error("Precision must be between 1 and 12");
  }

  if (lat < -90 || lat > 90) {
    throw new Error("Latitude must be between -90 and 90");
  }

  if (lng < -180 || lng > 180) {
    throw new Error("Longitude must be between -180 and 180");
  }

  let geohash = "";
  let evenBit = true;
  let bit = 0;
  let ch = 0;

  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      // Process longitude
      const lngMid = (lngMin + lngMax) / 2;
      if (lng >= lngMid) {
        ch |= 1 << (4 - bit);
        lngMin = lngMid;
      } else {
        lngMax = lngMid;
      }
    } else {
      // Process latitude
      const latMid = (latMin + latMax) / 2;
      if (lat >= latMid) {
        ch |= 1 << (4 - bit);
        latMin = latMid;
      } else {
        latMax = latMid;
      }
    }

    // Next bit
    evenBit = !evenBit;

    // If 5 bits processed, add character and reset
    if (++bit === 5) {
      geohash += BASE32.charAt(ch);
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}
//https://github.com/penpenpng/imhere-nostr/blob/main/src/lib/nominatim.ts
export interface Place {
  place_id: string;
  latLng: [number, number];
  geohash: string;
  name?: string;
  display_name?: string;
}

interface RawPlace {
  place_id: string;
  lat: string;
  lon: string;
  name: string;
  display_name: string;
}

/** https://nominatim.org/release-docs/latest/api/Search/ */
export async function searchPlace(q: string): Promise<LatLngExpression | null> {
  const xs = await get<RawPlace[]>(
    "https://nominatim.openstreetmap.org/search",
    {
      q,
      format: "jsonv2",
    }
  );
  console.log(xs);
  if (xs.length > 0) {
    const first = xs[0];
    return latLng(parseFloat(first.lat), parseFloat(first.lon));
  } else {
    return null;
  }
}

async function get<T = unknown>(
  url: string,
  query: Record<string, string>
): Promise<T> {
  const res = await fetch(`${url}?${new URLSearchParams(query)}`);
  return res.json();
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CONTACT_EMAIL = "wasil-app@wasil.ye";

interface Suggestion {
  address: string;
  lat: number;
  lng: number;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 2
): Promise<Response> {
  let lastError: Error | undefined;
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, init);
    if (res.ok) return res;
    const body = await res.text().catch(() => "");
    console.error(`Geocoder ${res.status} (attempt ${i + 1}): ${body}`);
    lastError = new Error(`Geocoder error ${res.status}`);
    if (res.status === 429) {
      await sleep(1500 * (i + 1));
      continue;
    }
    break;
  }
  throw lastError ?? new Error("Geocoder request failed");
}

async function searchLocationIq(query: string, apiKey: string): Promise<Suggestion[]> {
  const url =
    `https://api.locationiq.com/v1/autocomplete?key=${encodeURIComponent(apiKey)}` +
    `&q=${encodeURIComponent(query.trim())}&limit=5&countrycodes=ye`;

  const res = await fetchWithRetry(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": `WasilApp/1.0 (${CONTACT_EMAIL})`,
    },
  });

  const data = (await res.json()) as Array<{
    display_name?: string;
    lat?: string | number;
    lon?: string | number;
  }>;

  return data
    .filter((item) => item.display_name && item.lat != null && item.lon != null)
    .map((item) => ({
      address: item.display_name!,
      lat: typeof item.lat === "string" ? parseFloat(item.lat) : Number(item.lat),
      lng: typeof item.lon === "string" ? parseFloat(item.lon) : Number(item.lon),
    }));
}

// Serialize Nominatim calls inside a single worker to respect the 1 req/sec policy.
let nominatimQueue: Promise<unknown> = Promise.resolve();
let lastCall = 0;

async function searchNominatim(query: string): Promise<Suggestion[]> {
  const run = async () => {
    const now = Date.now();
    const wait = Math.max(0, 1200 - (now - lastCall));
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();

    const url =
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query.trim()
      )}&limit=5&addressdetails=1&countrycodes=ye`;

    const res = await fetchWithRetry(url, {
      headers: {
        "User-Agent": `WasilApp/1.0 (${CONTACT_EMAIL})`,
        "Accept-Language": "en-US,ar",
        "Accept": "application/json",
        "Referer": "https://wasil.ye",
      },
    });

    const data = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
    }>;

    return data.map((item) => ({
      address: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  };

  const promise = nominatimQueue.then(run, run);
  nominatimQueue = promise.catch(() => {});
  return promise as Promise<Suggestion[]>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { query } = await req.json();

    if (typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const locationIqKey = Deno.env.get("LOCATIONIQ_API_KEY");
    const suggestions = locationIqKey
      ? await searchLocationIq(query, locationIqKey)
      : await searchNominatim(query);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message ?? "Search failed" }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});

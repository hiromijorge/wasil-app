import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CONTACT_EMAIL = "aljofarinski@gmail.com";

let lastCall = 0;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { lat, lng } = await req.json();

    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      isNaN(lat) ||
      isNaN(lng)
    ) {
      return new Response(JSON.stringify({ error: "Invalid coordinates" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Nominatim asks for max 1 request per second. Best-effort per worker.
    const now = Date.now();
    const wait = Math.max(0, 1100 - (now - lastCall));
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": `WasilApp/1.0 (${CONTACT_EMAIL})`,
        "Accept-Language": "en-US,ar",
      },
    });

    if (!res.ok) {
      throw new Error(`Nominatim error ${res.status}`);
    }

    const data = await res.json();
    const address = data?.display_name ?? "";

    return new Response(JSON.stringify({ address, lat, lng }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message ?? "Geocoding failed" }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }
});

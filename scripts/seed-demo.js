/**
 * Partner testing seed script.
 *
 * Run:
 *   node scripts/seed-demo.js
 *
 * It will read SUPABASE_SERVICE_ROLE_KEY from .env.local.
 *
 * Creates one test account per role and a sample store/products/orders so a
 * partner can try every flow end-to-end.
 *
 * Requires all schema migrations (0003-0015) to be applied first.
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Load .env.local manually so the user doesn't have to export variables.
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !Object.prototype.hasOwnProperty.call(process.env, match[1])) {
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[match[1]] = value;
    }
  });
}

const PROJECT_REF = "njdndrpylsvxoyvflkcq";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY env variable.");
  console.error("Get it from Supabase Dashboard > Project Settings > API > service_role key.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ASSETS_DIR = path.join(__dirname, "..", "assets", "web");
const IMAGES_BUCKET = "marketplace-images";
const RECEIPTS_BUCKET = "receipts";

const PARTNER_PASSWORD = "wasilpartner2025";

const demoUsers = {
  customer: { email: "partner-customer@wasil.ye", password: PARTNER_PASSWORD, role: "customer", full_name: "Partner Customer" },
  merchant: { email: "partner-merchant@wasil.ye", password: PARTNER_PASSWORD, role: "merchant", full_name: "Partner Merchant" },
  admin: { email: "partner-admin@wasil.ye", password: PARTNER_PASSWORD, role: "admin", full_name: "Partner Admin" },
  driver: { email: "partner-driver@wasil.ye", password: PARTNER_PASSWORD, role: "driver", full_name: "Partner Driver" },
  partner: { email: "partner-partner@wasil.ye", password: PARTNER_PASSWORD, role: "partner", full_name: "Partner Referrer" },
};

const storesSeed = [
  {
    name: "Al-Shifa Pharmacy",
    category: "Pharmacy",
    category_emoji: "💊",
    location: "Sanaa, Yemen",
    whatsapp: "+967501234567",
    hours: "8AM - 10PM",
    open: true,
    image: "store-pharmacy.jpg",
    accent: "#0F766E",
    rating: 4.9,
    reviews: 312,
    lat: 15.3694,
    lng: 44.191,
    delivery_radius_km: 20,
    delivery_fee: 5,
    plan_id: "free",
  },
  {
    name: "Moda Fashion",
    category: "Fashion",
    category_emoji: "👗",
    location: "Sanaa, Yemen",
    whatsapp: "+967502345678",
    hours: "9AM - 9PM",
    open: true,
    image: "store-fashion.jpg",
    accent: "#BE185D",
    rating: 4.7,
    reviews: 198,
    lat: 15.372,
    lng: 44.195,
    delivery_radius_km: 15,
    delivery_fee: 7,
    plan_id: "business",
  },
  {
    name: "Al-Nour Grocery",
    category: "Food & Grocery",
    category_emoji: "🛒",
    location: "Sanaa, Yemen",
    whatsapp: "+967503456789",
    hours: "7AM - 11PM",
    open: true,
    image: "store-grocery.jpg",
    accent: "#15803D",
    rating: 4.8,
    reviews: 524,
    lat: 15.366,
    lng: 44.188,
    delivery_radius_km: 25,
    delivery_fee: 4,
    plan_id: "free",
  },
  {
    name: "Glow Cosmetics",
    category: "Cosmetics & Beauty",
    category_emoji: "💄",
    location: "Aden, Yemen",
    whatsapp: "+967504567890",
    hours: "10AM - 8PM",
    open: false,
    image: "store-cosmetics.jpg",
    accent: "#BE5B8A",
    rating: 4.6,
    reviews: 142,
    lat: 12.7855,
    lng: 45.0185,
    delivery_radius_km: 10,
    delivery_fee: 6,
    plan_id: "pro",
  },
];

const productsSeed = [
  { name: "Panadol 500mg", price: 18, image: "p-panadol.jpg", storeName: "Al-Shifa Pharmacy", description: "Effective pain relief tablets, 20 tablets per pack." },
  { name: "Amoxicillin 250mg", price: 38, image: "p-amoxicillin.jpg", storeName: "Al-Shifa Pharmacy", description: "Broad-spectrum antibiotic capsules." },
  { name: "Vitamin C 1000mg", price: 27, image: "p-vitc.jpg", storeName: "Al-Shifa Pharmacy", description: "Immune system support, 30 effervescent tablets." },
  { name: "Ibuprofen 400mg", price: 15, image: "p-ibuprofen.jpg", storeName: "Al-Shifa Pharmacy", description: "Anti-inflammatory pain reliever, 24 tablets." },
  { name: "Zinc Tablets", price: 30, image: "p-zinc.jpg", storeName: "Al-Shifa Pharmacy", description: "Immune support supplement, 60 tablets." },
  { name: "Men's Dress Shirt", price: 129, image: "p-shirt.jpg", storeName: "Moda Fashion", description: "Premium cotton dress shirt." },
  { name: "Women's Hijab Set", price: 76, image: "p-hijab.jpg", storeName: "Moda Fashion", description: "Elegant chiffon hijab set." },
  { name: "Kids Sneakers", price: 106, image: "p-sneakers.jpg", storeName: "Moda Fashion", description: "Comfortable sneakers for active kids." },
  { name: "Leather Belt", price: 53, image: "p-belt.jpg", storeName: "Moda Fashion", description: "Genuine leather belt." },
  { name: "Summer Dress", price: 136, image: "p-dress.jpg", storeName: "Moda Fashion", description: "Lightweight summer dress." },
  { name: "Sunflower Oil 1.8L", price: 48, image: "p-oil.jpg", storeName: "Al-Nour Grocery", description: "Pure sunflower cooking oil, 1.8L." },
  { name: "Long Grain Rice 5kg", price: 68, image: "p-rice.jpg", storeName: "Al-Nour Grocery", description: "Premium basmati rice, 5kg." },
  { name: "Fresh Milk 1L", price: 23, image: "p-milk.jpg", storeName: "Al-Nour Grocery", description: "Fresh full-cream milk, 1L." },
  { name: "Whole Wheat Bread", price: 12, image: "p-bread.jpg", storeName: "Al-Nour Grocery", description: "Freshly baked whole wheat loaf." },
  { name: "Mineral Water 6-pack", price: 30, image: "p-water.jpg", storeName: "Al-Nour Grocery", description: "Pack of 6 x 1.5L bottles." },
  { name: "Moisturizing Face Cream", price: 91, image: "p-cream.jpg", storeName: "Glow Cosmetics", description: "Hydrating face cream, 50ml." },
  { name: "Lip Gloss Set", price: 53, image: "p-lipgloss.jpg", storeName: "Glow Cosmetics", description: "Set of 4 shimmering lip glosses." },
  { name: "Sunscreen SPF50", price: 83, image: "p-sunscreen.jpg", storeName: "Glow Cosmetics", description: "Broad-spectrum SPF50 protection." },
  { name: "Rose Water Toner", price: 61, image: "p-toner.jpg", storeName: "Glow Cosmetics", description: "Natural rose water facial toner, 200ml." },
  { name: "Eyebrow Pencil", price: 38, image: "p-pencil.jpg", storeName: "Glow Cosmetics", description: "Long-lasting eyebrow pencil." },
];

async function ensureBucket(name, public = true) {
  const { data: bucket, error: getError } = await supabase.storage.getBucket(name);
  if (getError && getError.message?.includes("not found")) {
    const { error: createError } = await supabase.storage.createBucket(name, { public });
    if (createError) throw createError;
    console.log("Created bucket:", name);
  } else if (getError) {
    throw getError;
  } else {
    console.log("Bucket exists:", name);
  }
}

const uploadedUrls = new Map();

async function uploadImage(filename, bucket = IMAGES_BUCKET) {
  if (uploadedUrls.has(filename)) return uploadedUrls.get(filename);
  const filePath = path.join(ASSETS_DIR, filename);
  const file = fs.readFileSync(filePath);
  const storagePath = `demo/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, { contentType: "image/jpeg", upsert: true });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  const url = urlData.publicUrl;
  uploadedUrls.set(filename, url);
  console.log("Uploaded:", filename, "->", url);
  return url;
}

async function getOrCreateUser(email, password) {
  const { data: existing, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  const found = existing.users.find((u) => u.email === email);
  if (found) {
    console.log("User already exists:", email);
    return found.id;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  console.log("Created user:", email, data.user.id);
  return data.user.id;
}

async function seed() {
  await ensureBucket(IMAGES_BUCKET);
  await ensureBucket(RECEIPTS_BUCKET);

  // Create users
  const userIds = {};
  for (const [key, value] of Object.entries(demoUsers)) {
    userIds[key] = await getOrCreateUser(value.email, value.password);
  }

  // Upsert profiles
  const profiles = Object.entries(demoUsers).map(([key, value]) => ({
    id: userIds[key],
    email: value.email,
    full_name: value.full_name,
    role: value.role,
    referral_code: `${key.toUpperCase()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    is_partner: value.role === "partner",
    referred_by: value.role === "merchant" ? userIds.partner : null,
  }));

  const { error: profileError } = await supabase.from("profiles").upsert(profiles, { onConflict: "id" });
  if (profileError) throw profileError;
  console.log("Upserted profiles");

  // Upsert driver record (get-or-create because user_id has no unique constraint yet)
  const { data: existingDriver } = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", userIds.driver)
    .maybeSingle();
  if (!existingDriver) {
    const { error: driverError } = await supabase.from("drivers").insert({
      user_id: userIds.driver,
      full_name: demoUsers.driver.full_name,
      phone: "+967700111222",
      national_id: "DRIVER-12345",
      vehicle_type: "Motorcycle",
      vehicle_plate_number: "SANA-1234",
      status: "active",
      earnings_total_sar: 0,
      deliveries_completed: 0,
    });
    if (driverError) throw driverError;
    console.log("Created driver record");
  } else {
    console.log("Driver record already exists");
  }

  // Create a partner referral record for the demo merchant (get-or-create)
  const { data: existingReferral } = await supabase
    .from("referrals")
    .select("id")
    .eq("referrer_id", userIds.partner)
    .eq("referred_merchant_id", userIds.merchant)
    .maybeSingle();
  if (!existingReferral) {
    const { error: referralError } = await supabase.from("referrals").insert({
      referrer_id: userIds.partner,
      referred_merchant_id: userIds.merchant,
      code_used: "PARTNER1234",
    });
    if (referralError) throw referralError;
    console.log("Created referral record");
  } else {
    console.log("Referral record already exists");
  }

  // Remove any previously seeded demo stores so re-seeding stays idempotent
  // even if the partner-merchant user was recreated and stores exist under a
  // different owner_id.
  const { error: deleteStoresError } = await supabase
    .from("stores")
    .delete()
    .in("name", storesSeed.map((s) => s.name));
  if (deleteStoresError) throw deleteStoresError;
  console.log("Cleared existing demo stores");

  // Upload store images and insert stores
  const storeRows = [];
  for (const s of storesSeed) {
    const imageUrl = await uploadImage(s.image);
    storeRows.push({
      owner_id: userIds.merchant,
      name: s.name,
      category: s.category,
      category_emoji: s.category_emoji,
      location: s.location,
      whatsapp: s.whatsapp,
      hours: s.hours,
      open: s.open,
      image: imageUrl,
      accent: s.accent,
      rating: s.rating,
      reviews: s.reviews,
      is_demo: true,
      lat: s.lat,
      lng: s.lng,
      delivery_radius_km: s.delivery_radius_km,
      delivery_fee: s.delivery_fee,
      plan_id: s.plan_id,
      delivery_available: true,
      pickup_available: true,
    });
  }

  const { data: insertedStores, error: storeError } = await supabase
    .from("stores")
    .upsert(storeRows, { onConflict: "owner_id,name" })
    .select();
  if (storeError) throw storeError;
  console.log("Upserted stores:", insertedStores.length);

  const storeByName = Object.fromEntries(insertedStores.map((s) => [s.name, s]));

  // Upload product images and insert products
  const productRows = [];
  for (const p of productsSeed) {
    const store = storeByName[p.storeName];
    if (!store) continue;
    const imageUrl = await uploadImage(p.image);
    productRows.push({
      store_id: store.id,
      name: p.name,
      price: p.price,
      description: p.description,
      images: [imageUrl],
      is_demo: true,
    });
  }

  const { data: insertedProducts, error: productError } = await supabase
    .from("products")
    .upsert(productRows, { onConflict: "store_id,name" })
    .select();
  if (productError) throw productError;
  console.log("Upserted products:", insertedProducts.length);

  // Seed a sample order for Al-Shifa Pharmacy
  const alShifa = storeByName["Al-Shifa Pharmacy"];
  if (alShifa) {
    const alShifaProducts = insertedProducts.filter((p) => p.store_id === alShifa.id);
    const sampleItems = alShifaProducts.slice(0, 2).map((p) => ({
      product_id: p.id,
      name: p.name,
      price: p.price,
      quantity: 1,
      image: p.images?.[0],
    }));
    const subtotalSar = sampleItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryFeeSar = alShifa.delivery_fee;
    const totalSar = subtotalSar + deliveryFeeSar;

    const { error: orderError } = await supabase.from("orders").upsert({
      customer_id: userIds.customer,
      store_id: alShifa.id,
      status: "new",
      delivery_type: "delivery",
      delivery_fee: deliveryFeeSar,
      subtotal: subtotalSar,
      total: totalSar,
      subtotal_sar: subtotalSar,
      delivery_fee_sar: deliveryFeeSar,
      commission_sar: 0,
      plan_fee_deduction_sar: 0,
      items: sampleItems,
      phone: "+967700000000",
      address: "Sana'a, Hadda Street",
      notes: "Demo order",
      customer_payment_status: "pending",
    });
    if (orderError) throw orderError;
    console.log("Seeded sample order");
  }

  console.log("\nDemo credentials:");
  for (const [key, value] of Object.entries(demoUsers)) {
    console.log(`  ${key}:`, value.email, "/", value.password);
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

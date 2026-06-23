# Wasil Mobile App — Detailed Development Plan

## 1. Project Overview

**Product:** Wasil Yemen Connect — a single cross-platform Expo app that connects customers with local merchants, handles escrow payments, subscription billing, driver deliveries, referral commissions, and admin oversight.

**Repository folder:** `Mobile-E-commerce/`

**Backend:** One Supabase project (`https://njdndrpylsvxoyvflkcq.supabase.co`)

**Currency:** All user-facing prices in **SAR**. Database columns storing SAR end in `_sar`.

**Payment model (MVP):** Manual bank transfer → customer uploads receipt → admin verifies → escrow releases funds.

**Target platforms:** iOS, Android, Web (via React Native Web).

**Design reference:** `souqly-yemen-connect` (local TanStack Start prototype in the parent workspace). The mobile app must match its components, spacing, typography, shadows, radii, and micro-interactions as closely as React Native allows.

**Product policy (MVP):**
- No WhatsApp checkout or chat CTAs anywhere in the app.
- All transactions must go through the in-app cart and checkout flow.
- Customer ↔ merchant chat happens inside the app (simple text thread per store).

**Product philosophy for V1:**
> Simple, concise, useful, trustworthy, and easy to use for Yemeni users while still providing a modern and high-quality UI/UX experience.

Every feature must pass five questions before it ships in V1:
1. Does this solve a real user problem?
2. Is it easy for first-time users to understand?
3. Does it make the app more useful without adding confusion?
4. Is it appropriate for a V1 launch?
5. Will it help users find products, stores, or services faster?

We do not add features just because other marketplace apps have them. We focus on what is most valuable for Yemeni users and for a new marketplace that is still building trust and adoption.

---

## 2. Tech Stack & Architecture

### Frontend
- **Expo SDK 56** + **Expo Router** (file-based routing under `app/`)
- **React Native / React Native Web**
- **TypeScript**
- **TanStack Query** for server-state fetching/caching
- **React Hook Form + Zod** for forms and validation
- **lucide-react-native** icons
- **Theme tokens** in `src/lib/theme.ts` (palette, fonts, spacing, radii, shadows)

### Backend
- **Supabase Auth** (email + phone/OTP)
- **Postgres** database with RLS policies
- **Supabase Storage** for receipt and delivery-proof photos (`receipts` bucket)
- **Supabase Edge Functions** reserved for future bank API webhooks and push notification triggers

### Shared Code Conventions
- Use `src/lib/theme.ts` tokens everywhere.
- Use `formatSAR()` from `src/lib/demo-data.ts` for all displayed prices.
- Prefer `Button` and `Input` components in `src/components/`.
- All new queries live in `src/hooks/use<Name>.ts`.
- All Supabase table types come from `src/lib/database.types.ts`.

---

## 3. Role Entry Points

| Role | Route | Notes |
|---|---|---|
| Customer | `app/(tabs)/` | Bottom tabs: Home, Search, Stores, Plans, Cart |
| Merchant | `app/merchant-dashboard.tsx` | Internal tabs for Dashboard, Orders, Deliveries, Payouts, Billing, Profile |
| Driver | `app/driver-dashboard.tsx` | Active delivery list + status updates |
| Partner | `app/partner-dashboard.tsx` | Referral code, stats, commission history |
| Admin | `app/admin-dashboard.tsx` | Hub linking Payments, Billing, Drivers, Referrals, Config |

---

## 4. Database Plan

### Migrations (apply in order)
1. `0000_initial_schema.sql` — base users/profiles
2. `0001_admin_policies.sql` — admin RLS
3. `0002_fix_admin_rls.sql` — RLS fixes
4. `0003_marketplace_web_sync.sql` — stores, products, orders, plans
5. `0004_escrow_payout_model.sql` — payouts, commissions, subscription charges
6. `0005_partner_referral_commissions.sql` — referral logic
7. `0006_driver_delivery_workflow.sql` — drivers, deliveries, driver payouts
8. `0007_seed_upsert_constraints.sql` — unique constraints for seed-script upserts
9. `0008_driver_unassigned_policies.sql` — active drivers can claim broadcast deliveries
10. `0009_chat_messages.sql` — customer ↔ merchant chat tables
11. `0010_driver_self_application.sql` — authenticated users can apply as drivers
12. `0011_parcel_deliveries.sql` — peer-to-peer Wasil Send parcel delivery

### Key tables
- `profiles` (extends `auth.users`)
- `stores`
- `products`
- `orders` + `order_items`
- `payouts`
- `subscription_charges`
- `drivers`
- `deliveries`
- `referrals`
- `referral_commissions`
- `platform_config`

### Data integrity
- RLS policies for every table.
- Unique constraints already added in `0006` for `drivers(user_id)` and `referrals(referrer_id, referred_merchant_id)`.
- Triggers/functions automatically create `payouts`, `driver_payouts`, and `subscription_charges`.

### Seed
- File: `scripts/seed-demo.js`
- Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
- Creates demo users, stores, products, orders, payouts, charges, drivers, referrals.

---

## 5. Feature Modules

### 5.1 Auth & Onboarding
**Files:** `app/auth.tsx`, `app/index.tsx`, `src/lib/auth-context.tsx`

**Current state:**
- UI reverted to original simpler design.
- Email/phone toggle works via React Hook Form.
- Demo logins for customer, merchant, admin.

**Remaining work:**
- [ ] Hook phone auth to real Supabase OTP flow.
- [ ] Hook email confirmation flow.
- [ ] Add password reset.
- [ ] Add role-specific onboarding after sign-up (e.g., merchant enters store name).
- [x] Persist session and redirect returning users to the right dashboard.

**Acceptance criteria:**
- New users can sign up by email or phone.
- Returning users are auto-signed in.
- Each role lands on the correct dashboard.

---

### 5.2 Customer Marketplace
**Files:**
- `app/(tabs)/index.tsx`
- `app/(tabs)/search.tsx`
- `app/(tabs)/stores.tsx`
- `app/store/[id].tsx`
- `app/product/[id].tsx`
- `src/components/StoreCard.tsx`
- `src/components/ProductCard.tsx`
- `src/hooks/useStores.ts`, `useStore.ts`, `useProducts.ts`, `useProduct.ts`

**Current state:**
- UI/UX rebuilt to match the `souqly-yemen-connect` prototype (colors, typography, shadows, radii, layouts).
- Top bar logo aligned left, title centered when shown.
- Product grids use a consistent 2-column layout so cards no longer shrink.
- Stores screen has a search bar and a "Near me" chip (location-based sort on web).
- Screens render using `demo-data.ts`.
- `useStores`, `useStore`, `useProducts`, `useProduct` hooks exist but may still use demo data.
- No WhatsApp CTAs; store/product actions route through the cart or in-app chat.

**Remaining work:**
- [x] Update `useStores.ts` to query Supabase `stores` table (filtered by active, non-restricted).
- [x] Update `useStore.ts` to fetch a single store by id.
- [x] Update `useProducts.ts` to fetch products by `store_id`.
- [x] Update `useProduct.ts` to fetch a single product.
- [x] Replace demo-data imports in marketplace screens with real hooks.
- [x] Add loading skeletons and error retry UI.
- [x] Implement search across real stores and products.
- [x] **V1 sort & filter (essential only):**
  - [x] Category chips on Search and Stores (same component/pattern as Home).
  - [x] “Open now” toggle on Stores page.
  - [x] Simple sort on Search results: Relevance (default), Price low → high, Price high → low.
  - [x] Keep “Near me” sort on Stores page.
  - [ ] Defer to post-V1: price-range sliders, brand filters, rating filters, delivery-type filters, advanced keyword filters.

**Acceptance criteria:**
- Home shows real featured/open stores.
- Search returns real results.
- Store and product detail pages load from Supabase.

---

### 5.3 Cart & Checkout
**Files:**
- `src/lib/cart-context.tsx`
- `src/components/CartDrawer.tsx`
- `app/(tabs)/cart.tsx`
- `app/checkout.tsx`
- `app/order-success.tsx`
- `src/hooks/useCreateOrder.ts`
- `src/lib/orders.ts`

**Current state:**
- Cart context matches the prototype (`items: { product, quantity }`, `subtotal`, `isOpen`, `openCart`, `closeCart`).
- Slide-in `CartDrawer` with animated overlay.
- Bottom-nav cart tab opens the drawer instead of pushing a screen.
- Checkout groups items by store and supports per-store pickup/delivery toggle.
- Order success screen matches prototype style.

**Remaining work:**
- [x] Wire `checkout.tsx` to `useCreateOrder.ts`.
- [x] Upload receipt to Supabase Storage `receipts` bucket.
- [x] Create `orders` row with status `new` or `paid` (depending on payment method).
- [x] Create `order_items` rows (stored as JSON `items` column; no separate table in current schema).
- [ ] For plan subscriptions, create/attach to `subscription_charges`.
- [x] Show real order ID on `order-success.tsx`.
- [x] Add “My orders” screen for customers.

**Acceptance criteria:**
- A customer can add products, checkout, upload receipt, and receive an order ID.
- Order appears in merchant dashboard and admin payments screen.

---

### 5.4 In-app Chat
**Files:** `app/chat/[storeId].tsx`

**Current state:**
- Basic chat screen exists for customer ↔ merchant per store.
- Local state with simulated merchant reply.
- Entry point from store detail via “Message seller” button.

**Remaining work:**
- [x] Persist messages in Supabase (`messages`).
- [x] Subscribe to realtime messages.
- [x] Add merchant-side chat inbox.
- [ ] Support image attachments.

**Acceptance criteria:**
- Customers can message merchants without leaving the app.
- Merchants receive and reply to messages from their dashboard.

---

### 5.5 Merchant Dashboard
**File:** `app/merchant-dashboard.tsx`
**Hooks:** `useMerchantStore.ts`, `useMerchantOrders.ts`, `useMerchantPayouts.ts`, `useMerchantSubscription.ts`, `useBankAccount.ts`, `useMerchantBilling.ts`

**Current state:**
- UI complete with Dashboard, Orders, Deliveries, Payouts, Billing, Profile tabs.
- Uses the new `souqly-yemen-connect` theme tokens.
- WhatsApp references removed from dashboard stats and profile.
- Uses demo data/hooks.

**Remaining work:**
- [x] Load real store from `useMerchantStore`.
- [x] Load real orders from `useMerchantOrders`.
- [x] Implement status transitions: `new` → `paid` → `preparing` → `ready_for_delivery` → (delivery or pickup) → `completed`.
- [x] Add status-advance actions.
- [x] Delivery tab:
  - [x] “Assign my own driver” (update `orders.notes`, set `driver_assigned`).
  - [x] “Broadcast to Wasil drivers” (set `driver_assigned` and create `deliveries` row).
  - [x] Track statuses `driver_assigned` → `picked_up` → `on_the_way` → `delivered`.
- [x] Payouts tab: show real pending/released payouts from `useMerchantPayouts`.
- [x] Billing tab: upload plan-fee receipt and update `subscription_charges` status.
- [ ] Profile tab: edit store info and bank account (read-only for V1; editing deferred).

**Acceptance criteria:**
- Merchant can see orders, advance statuses, assign drivers, view payouts, and pay plan fees.
- Store restriction banner appears when subscription is overdue.

---

### 5.5 Delivery & Driver Workflow
**Files:**
- `app/driver-dashboard.tsx`
- `app/merchant-dashboard.tsx` (Deliveries tab)
- `src/hooks/useDriverRecord.ts`
- `src/hooks/useDriverDeliveries.ts`
- `src/hooks/useAdminDrivers.ts`
- `src/hooks/useAdminDriverPayouts.ts`
- `app/admin-drivers.tsx`

**Current state:**
- Driver dashboard skeleton exists.
- Hooks exist but likely use demo data.

**Remaining work:**
- [x] Driver sign-up flow: create `drivers` row with license/vehicle info.
- [x] Driver dashboard: list assigned deliveries from `useDriverDeliveries`.
- [x] Status actions: `picked_up`, `on_the_way`, `delivered`.
- [x] Upload delivery proof photo to Supabase Storage.
- [x] Merchant can assign a driver (see 5.4).
- [x] Admin can view/manage drivers and driver payouts.

**Acceptance criteria:**
- Driver sees only their active deliveries.
- Status updates reflect in merchant and admin views.
- Proof photo is stored and visible to admin/merchant.

---

### 5.6 Admin Operations
**Files:**
- `app/admin-dashboard.tsx`
- `app/admin-payments.tsx`
- `app/admin-billing.tsx`
- `app/admin-drivers.tsx`
- `app/admin-referrals.tsx`
- `app/admin-config.tsx`
- `src/hooks/useAdminOrders.ts`, `useAdminPayouts.ts`, `useAdminBilling.ts`, `useAdminDrivers.ts`, `useAdminReferrals.ts`, `usePlatformConfig.ts`

**Current state:**
- Admin hub and screens exist.
- Hooks exist.

**Remaining work:**
- [x] `admin-payments`: list orders pending verification, view receipt image, approve/reject, trigger escrow release.
- [x] `admin-billing`: list merchant plan-fee receipts pending verification, approve/reject.
- [x] `admin-drivers`: approve/reject driver applications, view documents.
- [ ] `admin-referrals`: view referral tree and commission history, mark commissions paid.
- [ ] `admin-config`: edit `platform_config` values (commission %, plan prices, bank details).

**Acceptance criteria:**
- Admin can verify receipts and release escrow.
- Admin can manage drivers, referrals, and platform config.

---

### 5.7 Partner Referral Program
**Files:**
- `app/partner-dashboard.tsx`
- `src/hooks/usePartnerStats.ts`
- `src/hooks/useAdminReferrals.ts`

**Current state:**
- Partner dashboard skeleton exists.

**Remaining work:**
- [ ] Show partner’s referral code and QR/share link.
- [ ] List referred merchants and earned commissions.
- [ ] Display paid vs pending commission totals.
- [ ] Allow partner to request payout.

**Acceptance criteria:**
- Partner sees accurate stats and commission history.
- New merchant sign-ups with a referral code credit the partner.

---

### 5.8 Billing & Subscriptions
**Files:**
- `app/(tabs)/plans.tsx`
- `app/checkout.tsx`
- `app/merchant-dashboard.tsx` (Billing tab)
- `src/lib/billing.ts`
- `src/hooks/useMerchantSubscription.ts`, `useMerchantBilling.ts`, `useAdminBilling.ts`

**Current state:**
- Plans screen uses local plan data.
- Merchant billing tab uses demo data.

**Remaining work:**
- [ ] Load plan tiers from `platform_config` or a `plans` table.
- [ ] Create `subscription_charges` on merchant sign-up/renewal.
- [x] Enforce store restriction when charge is overdue.
- [x] Allow merchant to upload receipt for plan fee.
- [x] Admin verifies plan-fee receipts and removes restriction.

**Acceptance criteria:**
- Merchant subscription is billed monthly.
- Overdue stores cannot receive new orders.
- Payment receipt verification clears the restriction.

---

### 5.9 Notifications
**Future phase**
- Expo Push notifications for order status changes.
- WhatsApp fallback when push token is missing.
- Trigger notifications from Supabase Edge Functions or database webhooks.

---

### 5.10 Wasil Send (Peer-to-Peer Delivery)
**Files:** `app/send.tsx`, `app/parcel-success.tsx`, `app/driver-dashboard.tsx`, `app/admin-payments.tsx`
**Hooks:** `useParcelEstimate.ts`, `useCreateParcel.ts`, `useCustomerParcels.ts`, `useDriverParcels.ts`, `useAdminParcels.ts`

**Current state:**
- `parcel_deliveries` table with RLS policies.
- Customer send form with fare estimate and list of past sends.
- Receipt upload on `parcel-success.tsx`.
- Driver dashboard shows parcel jobs with accept/status updates and proof photo.
- Admin payments screen has a Parcels tab to verify payment receipts.

**Remaining work:**
- [x] Create `parcel_deliveries` table and migration.
- [x] Fare estimate engine.
- [x] Customer send request flow.
- [x] Receipt upload and admin verification.
- [x] Driver parcel job list and status updates.
- [ ] Real distance-based pricing.
- [ ] Driver payout release for parcel deliveries.
- [ ] Parcel-specific push notifications.

**Acceptance criteria:**
- A customer can request a parcel pickup/dropoff, see fare, upload receipt, and track status.
- Admin verifies payment before driver dispatch.
- Driver accepts, picks up, and delivers parcel with proof photo.

---

## 6. Implementation Phases

### Phase 1 — Backend Ready
1. Apply migrations `0003` → `0006` in live Supabase (rerun-safe).
2. Run `node scripts/seed-demo.js` with service role key.
3. Verify RLS policies and seed data.

### Phase 2 — Marketplace Real Data
1. Wire `useStores`, `useStore`, `useProducts`, `useProduct` to Supabase.
2. Replace demo data in customer screens.
3. Add loading/error states.
4. Implement V1 sort & filter (category chips, open-now toggle, price sort, near me).

### Phase 3 — Checkout & Orders
1. Implement `useCreateOrder`.
2. Upload receipt to storage.
3. Create order + order_items rows.
4. Build customer “My orders” screen.

### Phase 4 — Merchant Operations
1. Real merchant store/orders/payouts/billing hooks.
2. Order status flow.
3. Delivery assignment flow.

### Phase 5 — Driver Workflow ✅
1. Driver application/approval.
2. Driver delivery status updates + proof upload.

### Phase 6 — Admin Verification ✅
1. Receipt verification for orders and billing.
2. Driver management.

### Phase 7 — Polish & Launch ✅
1. Arabic/English i18n scaffold + language toggle + RTL direction.
2. TypeScript and web export verification.
3. Push notifications and app store deployment deferred to post-V1.

### Phase 8 — Wasil Send ✅
1. `parcel_deliveries` table and RLS.
2. Customer send form + receipt upload.
3. Driver parcel jobs + proof photo.
4. Admin parcel payment verification.

---

## 7. Testing Checklist

- [x] Customer can browse real stores/products.
- [x] Customer can add to cart and checkout with receipt upload.
- [x] Admin sees order payment and can verify receipt.
- [x] Merchant sees order, prepares it, and advances status.
- [x] Merchant assigns driver or broadcasts.
- [x] Driver updates delivery status and uploads proof.
- [x] Admin releases escrow → merchant receives payout.
- [x] Merchant subscription billing restricts/unrestricts store.
- [ ] Partner referral credits commission correctly.
- [x] `npm run typecheck` passes.
- [x] `npx expo export --platform web` succeeds.
- [ ] iOS/Android builds succeed.

---

## 8. Useful Commands

```bash
# Type check
npm run typecheck

# Web build
npx expo export --platform web

# Start dev server
npx expo start

# Seed demo data
node scripts/seed-demo.js
```

---

## 9. Open Decisions

- Separate app per role vs one unified app?
- Push notification provider (Expo Push vs Firebase vs OneSignal)?
- Keep demo logins in production builds?
- When to integrate a real bank API?

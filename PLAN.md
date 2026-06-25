# Wasil Mobile App — Development Plan

## Overview

- **Product:** Wasil Yemen Connect — cross-platform Expo marketplace app.
- **Backend:** Supabase (`https://njdndrpylsvxoyvflkcq.supabase.co`).
- **Currency:** All user-facing prices in **SAR**.
- **Payments:** Manual bank transfer → customer uploads receipt → admin verifies → escrow releases.
- **Launch plan:** Free plan only (20 products, 1 photo per product).

## Tech stack

- Expo SDK 56 + Expo Router
- React Native / React Native Web
- TypeScript
- TanStack Query
- Supabase Auth, DB, Storage, Edge Functions
- lucide-react-native icons

## Role entry points

| Role | Route |
|---|---|
| Customer | `app/(tabs)/` |
| Merchant | `app/merchant-dashboard.tsx` |
| Driver | `app/driver-dashboard.tsx` |
| Partner | `app/partner-dashboard.tsx` |
| Admin | `app/admin-dashboard.tsx` |

## Database migrations (apply in order)

1. `supabase/migrations/0003_marketplace_web_sync.sql`
2. `supabase/migrations/0004_escrow_payout_model.sql`
3. `supabase/migrations/0005_partner_referral_commissions.sql`
4. `supabase/migrations/0006_driver_delivery_workflow.sql`
5. `supabase/migrations/0007_seed_upsert_constraints.sql`
6. `supabase/migrations/0008_driver_unassigned_policies.sql`
7. `supabase/migrations/0009_chat_messages.sql`
8. `supabase/migrations/0010_driver_self_application.sql`
9. `supabase/migrations/0011_parcel_deliveries.sql`
10. `supabase/migrations/0012_order_delivery_location.sql`
11. `supabase/migrations/0013_delivery_details.sql`
12. `supabase/migrations/0014_storage_buckets.sql`
13. `supabase/migrations/0015_push_notifications.sql`
14. `supabase/migrations/0016_addresses.sql`
15. `supabase/migrations/0017_reviews.sql`
16. `supabase/migrations/0018_order_cancellation.sql`
17. `supabase/migrations/0019_fix_push_secret.sql`

## Completed major features

- Customer marketplace (real Supabase stores/products, search, cart, checkout)
- Merchant dashboard (orders, product CRUD, deliveries, payouts, billing, onboarding)
- Driver workflow (application, deliveries, proof upload, status updates)
- Admin verification (payments, billing, drivers, referrals, platform config)
- Partner referrals and partner dashboard (copy/share code, referred merchants, commission history)
- In-app customer↔merchant chat
- Wasil Send parcel delivery
- Reviews/ratings for completed orders
- Order cancellation with refund tracking
- Saved address book
- Push notifications (FCM + Expo Push, DB triggers)
- Password reset + phone OTP sign-in
- Arabic/English i18n + language switcher

## Remaining work / post-launch ideas

- Real distance-based parcel pricing.
- Parcel-specific push notifications.
- Email confirmation flow polish.
- Partner payout request table + admin approval.
- iOS build validation.
- App store submissions.

## Useful commands

```bash
npm run typecheck
npx expo export --platform web
npx expo start
node scripts/seed-demo.js
```

## Demo data

Run `node scripts/seed-demo.js` with `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
Partner test accounts: `partner-{customer,merchant,admin,driver,partner}@wasil.ye` / `wasilpartner2025`.

See `PARTNER_TESTING.md` for full testing guide.

## UI/UX Sprint Tracker

> Last updated: 2026-06-24
> Tracks the current UI/UX polish sprint so work can resume if the session is interrupted.

### Phase 1 — Foundation fixes ✅ COMPLETE
- Title Case audit across English i18n keys; Arabic keys kept in sync.
- Fixed `Button` outline variant text contrast (`palette.primary`).
- Increased `Button` sm/icon touch targets.
- `/profile` referral code: copy-to-clipboard button + inline Toast.
- `/orders`: added subtitle.

**Build:** https://expo.dev/accounts/wasil-app/projects/wasil-yemen-mobile/builds/ab527193-f1cc-4d45-a3c7-58925ee82ac0

### Phase 2 — Customer pages UX upgrade ✅ COMPLETE
- `/orders`: filter chips (All/Active/Completed/Cancelled), redesigned order/send cards, empty states.
- `/search`: larger search bar, larger suggestion/sort chips, icon-based empty states.
- `/stores`: larger search bar, empty state with subtitle.
- `/profile`: membership card copy button, 56 px menu rows.
- `/addresses`: large full-width Add Address button, 40×40 icon action buttons.

**Build:** https://expo.dev/accounts/wasil-app/projects/wasil-yemen-mobile/builds/904d89f8-5b7d-4764-88a0-b37d3b0bbfa1

### Phase 3 — Merchant dashboard UX upgrade ✅ COMPLETE
**Goal:** Make merchant workflows faster and clearer, inspired by Grab/Gojek/Tokopedia/Shopee seller centers.

#### 3.1 Products tab
- [x] Add search bar filtering products by name.
- [x] Add sort options: Last Added, Name A-Z, Price Low-High, Price High-Low.
- [x] Add “Last added” badge on products created within last 7 days.
- [x] Replace small top-right Add Product button with a floating/action button.
- [x] Improve product grid card layout and empty state.

#### 3.2 Orders tab
- [x] Add filter chips: All / Active / Completed / Cancelled.
- [x] Localize status badges and add empty-state cards.
- [x] Pull-to-refresh feel.

#### 3.3 Dashboard tab
- [x] Replace hardcoded chart/mock stats with real data:
  - Orders today
  - Revenue today
  - Pending orders count
  - Total products
- [x] Clean stat cards with icon + value.
- [x] 7-day orders bar chart built from real order timestamps.

#### 3.4 Account tab
- [x] Group menu items visually: Store and Finances sections.

**Build:** https://expo.dev/accounts/wasil-app/projects/wasil-yemen-mobile/builds/be0767f0-468d-4d0b-b448-3035118bb9c8

### Phase 4 — Visual system consistency ✅ COMPLETE
- [x] Standardize card styles, shadows, border radii across all pages.
  - Added reusable `Card` and `CardPressable` components in `src/components/Card.tsx`.
  - Applied standardized card tokens (bg `palette.card`, 1px `palette.border` at 80% opacity, `radii.2xl`, `shadows.card`) to customer pages, role dashboards, auth, checkout, and shared card components.
- [x] Standardize empty states via new `EmptyState` component (orders, search, stores, addresses).
- [x] Standardize section headers via new `SectionHeader` component (orders, search, stores).
- [x] Final contrast and spacing audit.
  - Improved contrast on warning/default badges, demo notices, and restriction banners by using darker text on tinted backgrounds.
  - Verified consistent page padding, section gaps, and card internal padding.

### Commands to verify each phase
```bash
npm run typecheck
npx expo export --platform web
npx eas build --platform android --profile preview
```


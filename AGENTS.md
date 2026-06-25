# Wasil Mobile App — Agent Notes

## Project
- Expo SDK 56 cross-platform app (iOS/Android/Web) for the Wasil marketplace.
- Rebranded from Souqly. All user-facing prices are in **SAR**.
- Supabase backend: `https://njdndrpylsvxoyvflkcq.supabase.co`.

## Stack
- Expo Router (file-based routing)
- React Native / React Native Web
- TypeScript
- Supabase JS client
- lucide-react-native icons

## Conventions
- Use `src/lib/theme.ts` tokens (palette, fonts, spacing, radii, shadows).
- Prefer the existing `Button` and `Input` components in `src/components/`.
- All monetary amounts displayed to users must use `formatSAR()`.
- SAR-specific DB columns end in `_sar`. Legacy USD columns are ignored by the app.

## Roles & Entry Points
- `customer` → `app/(tabs)/` marketplace (Home, Search, Stores, Orders, Cart)
- `merchant` → `app/(merchant)/merchant-dashboard.tsx`
- `driver` → `app/(driver)/driver-dashboard.tsx`
- `partner` → `app/(partner)/partner-dashboard.tsx`
- `admin` → `app/(admin)/admin-dashboard.tsx`

## Database Migrations
Apply in order via Supabase SQL Editor:
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
18. `supabase/migrations/0020_mark_demo_data.sql`
19. `supabase/migrations/0021_dedupe_demo_stores.sql`
20. `supabase/migrations/0022_parcel_pricing.sql`
21. `supabase/migrations/0023_parcel_notifications.sql`
22. `supabase/migrations/0024_partner_payouts.sql`
23. `supabase/migrations/0025_merchant_driver_payouts.sql`
24. `supabase/migrations/0026_cash_payments.sql`
25. `supabase/migrations/0027_cash_payments_followup.sql`
26. `supabase/migrations/0028_cod_notifications.sql`
27. `supabase/migrations/0029_cod_guardrails.sql`

## Edge Functions
- `supabase/functions/search-location` — Nominatim-based address autocomplete (rate-limited to ~1 req/sec).
- `supabase/functions/geocode` — Reverse geocoding for "Use my current location".

## Demo Data
Run `node scripts/seed-demo.js` after applying migrations and setting `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

## Useful Commands
- `npm run typecheck` — TypeScript check
- `npx expo export --platform web` — web build
- `npx expo start` — local dev

## Docs
- Read exact Expo versioned docs: https://docs.expo.dev/versions/v56.0.0/

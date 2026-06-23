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
- `merchant` → `app/merchant-dashboard.tsx`
- `driver` → `app/driver-dashboard.tsx`
- `partner` → `app/partner-dashboard.tsx`
- `admin` → `app/admin-dashboard.tsx`

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

## Demo Data
Run `node scripts/seed-demo.js` after applying migrations and setting `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

## Useful Commands
- `npm run typecheck` — TypeScript check
- `npx expo export --platform web` — web build
- `npx expo start` — local dev

## Docs
- Read exact Expo versioned docs: https://docs.expo.dev/versions/v56.0.0/

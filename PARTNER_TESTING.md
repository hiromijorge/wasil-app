# Partner Testing Guide — Wasil

## Test environment

- App: Android build (package `com.wasil.yemen`)
- Backend: Supabase project `njdndrpylsvxoyvflkcq`
- Demo mode: **disabled for partner testing** (real accounts, real data)

## Test accounts

Run `node scripts/seed-demo.js` with `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` to create these accounts:

| Role | Email | Password |
|---|---|---|
| Customer | `partner-customer@wasil.ye` | `wasilpartner2025` |
| Merchant | `partner-merchant@wasil.ye` | `wasilpartner2025` |
| Driver | `partner-driver@wasil.ye` | `wasilpartner2025` |
| Admin | `partner-admin@wasil.ye` | `wasilpartner2025` |
| Partner | `partner-partner@wasil.ye` | `wasilpartner2025` |

## Critical flows to test

### 1. Customer shopping
1. Sign in as **Customer**.
2. Browse home, search, stores.
3. Add products to cart.
4. Checkout with delivery address + phone.
5. Upload payment receipt.
6. Track order status.

### 2. Merchant operations
1. Sign in as **Merchant**.
2. (If no store exists, complete onboarding.)
3. View orders on dashboard.
4. Add/edit/delete products.
5. Confirm free plan limit: max 20 products, 1 photo each.
6. Update order status (preparing → ready → etc).
7. View billing screen (should show Free plan, no charges).

### 3. Driver delivery
1. Sign in as **Driver**.
2. Apply/be activated by admin.
3. Accept delivery job.
4. Update status: picked up → on the way → delivered.
5. Upload delivery proof photo.

### 4. Admin oversight
1. Sign in as **Admin**.
2. Verify customer payment receipts.
3. Activate/suspend drivers.
4. Review orders, payouts, referrals.

### 5. Partner referrals
1. Sign in as **Partner**.
2. Copy referral code.
3. Use code when creating a new merchant account.
4. Confirm commission appears on partner dashboard.

## Push notifications

- Accept notification permission on first launch.
- Test notifications: new order, order status update, new message.
- Note: Push requires a physical Android device or a production EAS build. Expo Go does not support FCM.

## Known limitations for partner testing

- Payments are manual bank transfer + admin verification (no live gateway).
- All merchants are on the Free plan at launch.
- Subscription billing is not active.

## How to report issues

Send screenshots + role + exact steps to the development team.

# Billing Backend Setup (Stripe + Supabase)

Run the SQL in `supabase/sql/20250809_billing_schema.sql` in the Supabase SQL editor to create tables, indexes, and RLS policies.

Then set Edge Function secrets in Supabase (Dashboard → Project Settings → Functions → Secrets):
- STRIPE_SECRET_KEY = sk_test_...
- STRIPE_WEBHOOK_SECRET = whsec_...
- SUPABASE_SERVICE_ROLE_KEY (already present in this project)

Deploy/enable the following Edge Functions (already in repo):
- create-checkout
- customer-portal
- check-subscription
- stripe-webhook (new)
- me (new)
- me-entitlements (new)

Configure Stripe Webhook (Developers → Webhooks):
- URL: https://<your-project-ref>.functions.supabase.co/stripe-webhook
- Events: checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, invoice.payment_succeeded, invoice.payment_failed

Contracts used by the frontend today:
- check-subscription → { subscribed, subscription_tier: 'free'|'premium', subscription_end }

Additional endpoints for compatibility:
- me → { id, email, isPremium, plan, subscription_status, current_period_end }
- me-entitlements → { tier, entitlements }

Notes:
- No frontend changes are required visually. To make the backend effective, ensure the frontend hook uses the check-subscription function instead of the mock (toggle in useSubscription when ready).
- Webhooks are idempotent using the processed_events table.

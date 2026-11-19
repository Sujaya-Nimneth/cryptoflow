BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path TO public, extensions;
SELECT plan(19);

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-a@example.test', crypt('Password123', gen_salt('bf')), now(), now(), now()),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-b@example.test', crypt('Password123', gen_salt('bf')), now(), now(), now());

SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SET LOCAL ROLE authenticated;

INSERT INTO public.portfolio_holdings (crypto_id, quantity, purchase_price) VALUES ('bitcoin', 0.5, 40000);
INSERT INTO public.watchlist_entries (crypto_id) VALUES ('ethereum');
INSERT INTO public.price_alerts (crypto_id, direction, target_price) VALUES ('bitcoin', 'above', 70000);

SELECT is((SELECT count(*) FROM public.portfolio_holdings), 1::bigint, 'Owner A sees only their holding');
SELECT is((SELECT count(*) FROM public.watchlist_entries), 1::bigint, 'Owner A sees only their watchlist entry');
SELECT is((SELECT count(*) FROM public.price_alerts), 1::bigint, 'Owner A sees only their alert');

SELECT throws_ok(
  $$INSERT INTO public.portfolio_holdings (user_id, crypto_id, quantity, purchase_price) VALUES ('00000000-0000-4000-8000-000000000002', 'solana', 1, 100)$$,
  '42501',
  NULL,
  'Owner A cannot insert a holding for Owner B'
);
SELECT throws_ok(
  $$INSERT INTO public.watchlist_entries (user_id, crypto_id) VALUES ('00000000-0000-4000-8000-000000000002', 'solana')$$,
  '42501',
  NULL,
  'Owner A cannot insert a watchlist entry for Owner B'
);
SELECT throws_ok(
  $$INSERT INTO public.price_alerts (user_id, crypto_id, direction, target_price) VALUES ('00000000-0000-4000-8000-000000000002', 'solana', 'below', 10)$$,
  '42501',
  NULL,
  'Owner A cannot insert an alert for Owner B'
);

SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
SELECT is((SELECT count(*) FROM public.portfolio_holdings), 0::bigint, 'Owner B cannot read Owner A holdings');
SELECT is((SELECT count(*) FROM public.watchlist_entries), 0::bigint, 'Owner B cannot read Owner A watchlist');
SELECT is((SELECT count(*) FROM public.price_alerts), 0::bigint, 'Owner B cannot read Owner A alerts');

DELETE FROM public.portfolio_holdings WHERE crypto_id = 'bitcoin';
SELECT is((SELECT count(*) FROM public.portfolio_holdings), 0::bigint, 'Owner B delete does not remove Owner A holding');

RESET ROLE;
SELECT is((SELECT count(*) FROM public.portfolio_holdings), 1::bigint, 'Owner A holding remains after Owner B delete');

SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
SET LOCAL ROLE authenticated;
SELECT throws_ok($$UPDATE public.portfolio_holdings SET quantity = 2$$, '42501', NULL, 'Update privilege is not granted');
SELECT throws_ok($$INSERT INTO public.portfolio_holdings (crypto_id, quantity, purchase_price) VALUES ('bitcoin', 0, 10)$$, '23514', NULL, 'Quantity must be positive');
SELECT throws_ok($$INSERT INTO public.portfolio_holdings (crypto_id, quantity, purchase_price) VALUES ('Bitcoin', 1, 10)$$, '23514', NULL, 'Coin id must be lowercase');
SELECT throws_ok($$INSERT INTO public.price_alerts (crypto_id, direction, target_price) VALUES ('bitcoin', 'sideways', 10)$$, '23514', NULL, 'Alert direction is constrained');
SELECT throws_ok($$INSERT INTO public.watchlist_entries (crypto_id) VALUES ('ethereum')$$, '23505', NULL, 'Watchlist prevents duplicate coins per owner');

RESET ROLE;
SELECT has_table('public', 'portfolio_holdings', 'Portfolio table exists');
SELECT has_table('public', 'watchlist_entries', 'Watchlist table exists');
SELECT has_table('public', 'price_alerts', 'Alerts table exists');

SELECT * FROM finish();
ROLLBACK;

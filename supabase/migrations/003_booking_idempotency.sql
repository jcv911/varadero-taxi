-- Idempotency for POST /api/bookings.
--
-- A retried submission (double tap, dropped response, resubmit after an error) must
-- resolve to the booking it already created instead of inserting a second identical row.
--
-- The index is partial so rows written without a key keep behaving exactly as before:
-- uniqueness only applies to requests that actually carry one.
--
-- The API tolerates this migration not being applied yet (it retries without the column),
-- so applying it is safe at any time and does not require coordinating a deploy.

alter table public.bookings
  add column if not exists idempotency_key text;

create unique index if not exists bookings_idempotency_key_key
  on public.bookings (idempotency_key)
  where idempotency_key is not null;

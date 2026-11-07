alter table public.bookings
  add column if not exists direction text not null default 'from';

alter table public.bookings
  add column if not exists other_address text;
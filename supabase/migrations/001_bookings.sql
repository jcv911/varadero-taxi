create extension if not exists "pgcrypto";

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  status text not null default 'pendiente',
  mode text not null,
  route_id text,
  custom_destination text,
  vehicle_id text not null,
  date text not null,
  time text not null,
  price_usd numeric not null,
  name text not null,
  whatsapp text not null,
  email text,
  hotel_pickup text not null,
  flight_number text,
  passengers integer not null,
  luggage integer not null,
  hours integer,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;
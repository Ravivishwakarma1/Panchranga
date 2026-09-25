-- Panchranga Newsletter System Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz default now(),
  is_active boolean default true,
  unsubscribe_token uuid default gen_random_uuid(),
  source text default 'website'
);

-- Index for fast email lookup
create index if not exists idx_subscribers_email 
  on newsletter_subscribers(email);

-- Index for unsubscribe token lookup
create index if not exists idx_subscribers_token 
  on newsletter_subscribers(unsubscribe_token);

-- Also create a newsletter_sends log table
create table if not exists newsletter_sends (
  id uuid primary key default gen_random_uuid(),
  sent_at timestamptz default now(),
  subscriber_count int,
  hub_ids text[], -- which 3 hubs were featured
  status text default 'sent'
);

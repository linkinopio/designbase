-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- Model: sentence-transformers/all-MiniLM-L6-v2 (HF pipeline/feature-extraction) → 384 dimensions

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Drop old 1536-dim column if it exists, add 384-dim column
alter table decisions drop column if exists embedding;
alter table decisions add column if not exists embedding vector(384);

-- 3. Create similarity search function (384 dims)
create or replace function match_decisions(
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  exclude_id uuid default null
)
returns table (id uuid, title text, description text, similarity float)
language sql stable
as $$
  select
    id,
    title,
    description,
    1 - (embedding <=> query_embedding) as similarity
  from decisions
  where embedding is not null
    and (exclude_id is null or id != exclude_id)
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- 4. Index for fast cosine search
drop index if exists decisions_embedding_idx;
create index decisions_embedding_idx
  on decisions using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

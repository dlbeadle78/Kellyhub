alter table public.library_items
  add column if not exists extraction_status text not null default 'pending' check (extraction_status in ('pending','processing','needs_review','ready','failed')),
  add column if not exists extraction_method text,
  add column if not exists extracted_at timestamptz,
  add column if not exists classification_status text not null default 'suggested' check (classification_status in ('suggested','confirmed')),
  add column if not exists suggested_subject_slug text,
  add column if not exists suggested_unit_slug text,
  add column if not exists suggested_topic_slug text,
  add column if not exists source_page_count integer,
  add column if not exists extraction_note text;

update public.library_items
set extraction_status = case when coalesce(length(trim(extracted_text)),0) > 0 then 'needs_review' else 'pending' end,
    extracted_at = case when coalesce(length(trim(extracted_text)),0) > 0 then coalesce(extracted_at, updated_at, created_at) else extracted_at end
where extraction_status = 'pending';

create index if not exists library_items_extraction_idx on public.library_items(user_id, extraction_status, created_at desc);
create index if not exists library_chunks_user_item_idx on public.library_chunks(user_id, library_item_id, chunk_index);
create index if not exists library_chunks_fts_idx on public.library_chunks using gin (to_tsvector('english', content));
create index if not exists library_items_fts_idx on public.library_items using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(extracted_text,'')));

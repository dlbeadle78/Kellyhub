alter table public.quick_capture
  add column if not exists extracted_text text,
  add column if not exists extraction_status text not null default 'pending',
  add column if not exists extraction_method text,
  add column if not exists extracted_at timestamptz,
  add column if not exists extraction_note text;

create index if not exists quick_capture_extraction_status_idx on public.quick_capture(user_id, extraction_status, created_at desc);

create or replace function public.search_library_knowledge(
  p_query text,
  p_subject_slug text default null,
  p_limit integer default 18
)
returns table (
  library_item_id uuid,
  capture_id uuid,
  title text,
  subject_slug text,
  unit_slug text,
  topic_slug text,
  purpose text,
  source_url text,
  chunk_index integer,
  content text,
  score numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with terms as (
    select distinct lower(word) as term
    from regexp_split_to_table(
      regexp_replace(coalesce(p_query, ''), '[^[:alnum:]]+', ' ', 'g'),
      E'\\s+'
    ) as word
    where length(word) >= 3
      and lower(word) not in (
        'the','and','for','with','from','this','that','these','those','what','why','how','who','where','when',
        'explain','teach','tell','show','using','use','about','into','does','have','has','had','are','was','were',
        'can','could','would','should','my','our','your','their','teacher','teachers','material','materials','notes',
        'resource','resources','saved','library','please','help','learn','study','revise','revision'
      )
  ),
  scored as (
    select
      li.id as library_item_id,
      li.capture_id,
      li.title,
      li.subject_slug,
      li.unit_slug,
      li.topic_slug,
      li.purpose,
      li.source_url,
      lc.chunk_index,
      lc.content,
      (
        (select count(*)::numeric from terms t where lower(lc.content) like '%' || t.term || '%')
        + 2 * (select count(*)::numeric from terms t where lower(coalesce(li.title,'') || ' ' || coalesce(li.topic_slug,'')) like '%' || t.term || '%')
        + 1.5 * (select count(*)::numeric from terms t where lower(coalesce(li.subject_slug,'') || ' ' || coalesce(li.unit_slug,'') || ' ' || array_to_string(coalesce(li.tags,'{}'::text[]),' ')) like '%' || t.term || '%')
      ) as score
    from public.library_chunks lc
    join public.library_items li on li.id = lc.library_item_id
    where lc.user_id = auth.uid()
      and li.user_id = auth.uid()
      and li.status = 'active'
      and li.extraction_status = 'ready'
      and li.classification_status = 'confirmed'
      and (p_subject_slug is null or p_subject_slug = '' or li.subject_slug = p_subject_slug)
  )
  select
    library_item_id,
    capture_id,
    title,
    subject_slug,
    unit_slug,
    topic_slug,
    purpose,
    source_url,
    chunk_index,
    content,
    score
  from scored
  where score > 0
  order by score desc, title asc, chunk_index asc
  limit least(greatest(coalesce(p_limit,18),1),40);
$$;

grant execute on function public.search_library_knowledge(text,text,integer) to authenticated;

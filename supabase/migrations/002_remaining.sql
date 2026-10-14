-- Sisa skema. Jalankan di SQL Editor Supabase (proyek kabarku) setelah 001 sebagian terpasang.
-- Aman dijalankan ulang.

create or replace function delete_item(p_edit_token text, p_id text)
returns void
language plpgsql security definer set search_path = public
as $$
declare b boards;
begin
  select * into b from boards where edit_token = p_edit_token;
  if not found then raise exception 'Token tidak valid'; end if;
  delete from items where board_id = b.id and id = p_id;
end $$;

create or replace function update_board(p_edit_token text, p_patch json)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update boards set
    title = left(coalesce(p_patch->>'title', title), 80),
    cover_message = left(coalesce(p_patch->>'cover_message', cover_message), 500),
    music_url = left(coalesce(p_patch->>'music_url', music_url), 500)
  where edit_token = p_edit_token;
  if not found then raise exception 'Token tidak valid'; end if;
end $$;

revoke all on function create_board(text, text), get_board(text), save_item(text, json), delete_item(text, text), update_board(text, json) from public;
grant execute on function create_board(text, text), get_board(text), save_item(text, json), delete_item(text, text), update_board(text, json) to anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('boards-media', 'boards-media', true, 10485760,
  array['image/jpeg','image/png','image/webp','audio/mpeg','audio/mp4','audio/ogg','audio/wav','audio/webm','audio/aac','audio/x-m4a'])
on conflict (id) do nothing;

drop policy if exists "unggah media papan" on storage.objects;
create policy "unggah media papan" on storage.objects
  for insert to anon with check (bucket_id = 'boards-media');

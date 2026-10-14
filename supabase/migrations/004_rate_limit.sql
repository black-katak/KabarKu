-- Batas pembuatan papan agar kuota gratis tidak habis oleh penyalahgunaan.
-- Per alamat IP: 10 papan per jam. Seluruh sistem: 300 papan per jam.
-- Jalankan di SQL Editor Supabase. Aman dijalankan ulang.

alter table boards add column if not exists creator_ip text not null default '';

create or replace function create_board(p_title text, p_cover text)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  b boards;
  ip text := '';
  hdr json;
begin
  begin
    hdr := current_setting('request.headers', true)::json;
    ip := left(trim(split_part(coalesce(hdr->>'x-forwarded-for', hdr->>'cf-connecting-ip', ''), ',', 1)), 60);
  exception when others then
    ip := '';
  end;

  if ip <> '' and (select count(*) from boards where creator_ip = ip and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Terlalu banyak papan dibuat. Coba lagi nanti.';
  end if;
  if (select count(*) from boards where created_at > now() - interval '1 hour') >= 300 then
    raise exception 'Layanan sedang ramai. Coba lagi nanti.';
  end if;

  insert into boards (title, cover_message, view_token, edit_token, creator_ip)
  values (
    left(coalesce(nullif(p_title, ''), 'Papan Kita'), 80),
    left(coalesce(p_cover, ''), 500),
    replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
    replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
    ip
  ) returning * into b;
  return json_build_object('view_token', b.view_token, 'edit_token', b.edit_token);
end $$;

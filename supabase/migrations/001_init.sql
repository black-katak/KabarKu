-- KabarKu: skema untuk Supabase paket Free.
-- Jalankan di SQL Editor Supabase. Tabel tidak bisa diakses langsung.
-- Semua akses lewat fungsi yang memeriksa token.

create table if not exists boards (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Papan Kita',
  cover_message text not null default '',
  music_url text not null default '',
  view_token text not null unique,
  edit_token text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists items (
  id text not null,
  board_id uuid not null references boards(id) on delete cascade,
  type text not null check (type in ('note', 'photo', 'sticker')),
  content text not null default '',
  caption text not null default '',
  color text not null default '#fff176',
  paper text not null default 'postit',
  width int not null default 200,
  height int not null default 200,
  sticker text not null default '',
  image_url text not null default '',
  x real not null default 0,
  y real not null default 0,
  rotation real not null default 0,
  z int not null default 1,
  created_at timestamptz not null default now(),
  primary key (board_id, id)
);

alter table boards enable row level security;
alter table items enable row level security;
-- Tanpa policy: anon tidak bisa baca atau tulis langsung.

create or replace function create_board(p_title text, p_cover text)
returns json
language plpgsql security definer set search_path = public
as $$
declare b boards;
begin
  insert into boards (title, cover_message, view_token, edit_token)
  values (
    left(coalesce(nullif(p_title, ''), 'Papan Kita'), 80),
    left(coalesce(p_cover, ''), 500),
    replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
    replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
  ) returning * into b;
  return json_build_object('view_token', b.view_token, 'edit_token', b.edit_token);
end $$;

create or replace function get_board(p_token text)
returns json
language plpgsql security definer set search_path = public
as $$
declare b boards; r text;
begin
  select * into b from boards where view_token = p_token or edit_token = p_token;
  if not found then return null; end if;
  r := case when b.edit_token = p_token then 'edit' else 'view' end;
  return json_build_object(
    'role', r,
    'board', json_build_object(
      'title', b.title,
      'cover_message', b.cover_message,
      'music_url', b.music_url,
      'view_token', b.view_token,
      'edit_token', case when r = 'edit' then b.edit_token else null end
    ),
    'items', coalesce((
      select json_agg(json_build_object(
        'id', i.id, 'type', i.type, 'content', i.content, 'caption', i.caption,
        'color', i.color, 'paper', i.paper, 'width', i.width, 'height', i.height,
        'sticker', i.sticker, 'image_url', i.image_url, 'x', i.x, 'y', i.y,
        'rotation', i.rotation, 'z', i.z
      ) order by i.created_at) from items i where i.board_id = b.id
    ), '[]'::json)
  );
end $$;

create or replace function save_item(p_edit_token text, p_item json)
returns void
language plpgsql security definer set search_path = public
as $$
declare b boards;
begin
  select * into b from boards where edit_token = p_edit_token;
  if not found then raise exception 'Token tidak valid'; end if;
  if (select count(*) from items where board_id = b.id) > 500 then
    raise exception 'Papan penuh';
  end if;
  insert into items (id, board_id, type, content, caption, color, paper, width, height,
                     sticker, image_url, x, y, rotation, z)
  values (
    p_item->>'id', b.id, p_item->>'type',
    left(coalesce(p_item->>'content', ''), 1000),
    left(coalesce(p_item->>'caption', ''), 200),
    left(coalesce(p_item->>'color', '#fff176'), 20),
    coalesce(p_item->>'paper', 'postit'),
    coalesce((p_item->>'width')::int, 200), coalesce((p_item->>'height')::int, 200),
    left(coalesce(p_item->>'sticker', ''), 20),
    left(coalesce(p_item->>'image_url', ''), 500),
    coalesce((p_item->>'x')::real, 0), coalesce((p_item->>'y')::real, 0),
    coalesce((p_item->>'rotation')::real, 0), coalesce((p_item->>'z')::int, 1)
  )
  on conflict (board_id, id) do update set
    content = excluded.content, caption = excluded.caption, color = excluded.color,
    paper = excluded.paper, width = excluded.width, height = excluded.height,
    sticker = excluded.sticker, image_url = excluded.image_url,
    x = excluded.x, y = excluded.y, rotation = excluded.rotation, z = excluded.z;
end $$;

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

revoke all on function create_board, get_board, save_item, delete_item, update_board from public;
grant execute on function create_board, get_board, save_item, delete_item, update_board to anon;

-- Penyimpanan foto dan lagu (publik untuk dibaca, batas 10 MB).
insert into storage.buckets (id, name, public, file_size_limit)
values ('boards-media', 'boards-media', true, 10485760)
on conflict (id) do nothing;

create policy "unggah media papan" on storage.objects
  for insert to anon with check (bucket_id = 'boards-media');

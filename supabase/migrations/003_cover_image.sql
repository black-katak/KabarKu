-- Foto sampul papan. Jalankan di SQL Editor Supabase. Aman dijalankan ulang.

alter table boards add column if not exists cover_image text not null default '';

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
      'cover_image', b.cover_image,
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

create or replace function update_board(p_edit_token text, p_patch json)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update boards set
    title = left(coalesce(p_patch->>'title', title), 80),
    cover_message = left(coalesce(p_patch->>'cover_message', cover_message), 500),
    music_url = left(coalesce(p_patch->>'music_url', music_url), 500),
    cover_image = left(coalesce(p_patch->>'cover_image', cover_image), 500)
  where edit_token = p_edit_token;
  if not found then raise exception 'Token tidak valid'; end if;
end $$;

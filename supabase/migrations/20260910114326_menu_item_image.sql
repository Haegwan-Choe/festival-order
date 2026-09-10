-- 메뉴에 사진을 붙일 수 있도록 image_url 컬럼 추가 (일단 URL 문자열만,
-- 실제 업로드 플로우는 나중에 Supabase Storage 붙여서 확장 가능)
alter table menu_item add column image_url text;

drop function if exists create_menu_item(text, integer, text);

create or replace function create_menu_item(
  p_name text,
  p_price integer,
  p_category text,
  p_image_url text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  if not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  insert into menu_item (name, price, category, available, image_url)
    values (p_name, p_price, p_category, true, p_image_url)
    returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function create_menu_item(text, integer, text, text) from public, anon;
grant execute on function create_menu_item(text, integer, text, text) to authenticated;

drop function if exists update_menu_item(bigint, text, integer, text, boolean);

create or replace function update_menu_item(
  p_id bigint,
  p_name text,
  p_price integer,
  p_category text,
  p_available boolean,
  p_image_url text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  update menu_item
    set name = p_name,
        price = p_price,
        category = p_category,
        available = p_available,
        image_url = p_image_url
    where id = p_id;

  if not found then
    raise exception 'unknown menu item id: %', p_id;
  end if;
end;
$$;

revoke execute on function update_menu_item(bigint, text, integer, text, boolean, text) from public, anon;
grant execute on function update_menu_item(bigint, text, integer, text, boolean, text) to authenticated;

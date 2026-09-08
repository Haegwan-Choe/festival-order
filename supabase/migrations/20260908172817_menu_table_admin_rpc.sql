-- 관리자용 메뉴/테이블 관리 RPC
-- 지금까지는 menu_item/dining_table 조회만 공개, 쓰기는 전면 차단이라
-- 메뉴 가격 수정·품절 처리·테이블 추가를 앱에서 할 방법이 없었음.
-- confirm_payment 등과 동일한 패턴(admins 등록 여부 체크 + anon 접근 차단)으로 추가.

-- 관리자: 메뉴 신규 등록
create or replace function create_menu_item(p_name text, p_price integer, p_category text)
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

  insert into menu_item (name, price, category, available)
    values (p_name, p_price, p_category, true)
    returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function create_menu_item(text, integer, text) from public, anon;
grant execute on function create_menu_item(text, integer, text) to authenticated;

-- 관리자: 메뉴 수정 (이름/가격/카테고리/품절여부 전체 갱신)
create or replace function update_menu_item(
  p_id bigint,
  p_name text,
  p_price integer,
  p_category text,
  p_available boolean
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
        available = p_available
    where id = p_id;

  if not found then
    raise exception 'unknown menu item id: %', p_id;
  end if;
end;
$$;

revoke execute on function update_menu_item(bigint, text, integer, text, boolean) from public, anon;
grant execute on function update_menu_item(bigint, text, integer, text, boolean) to authenticated;

-- 관리자: 테이블 추가 (행사 중 좌석을 늘려야 할 때)
create or replace function add_dining_table(p_table_number integer)
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

  insert into dining_table (table_number, status)
    values (p_table_number, 'EMPTY')
    returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function add_dining_table(integer) from public, anon;
grant execute on function add_dining_table(integer) to authenticated;

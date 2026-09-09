-- 테이블 번호 체계를 단일 정수(table_number)에서 구역+번호(zone, seat_number)로 변경.
-- 부스가 A/B 구역으로 나뉘고, 행사 중 테이블을 물리적으로 옮길 수도 있어서
-- "라벨"과 "실제 테이블(id)"을 분리해두는 편이 이동 처리에도 유리함.
--
-- 아직 실사용 데이터가 없는 개발 단계라 기존 테이블/주문 데이터는 비우고 진행.

truncate table order_item, orders, dining_table restart identity cascade;

alter table dining_table
  drop column table_number,
  add column zone text not null,
  add column seat_number integer not null,
  add constraint dining_table_zone_seat_key unique (zone, seat_number);

-- ============================================================
-- RPC 함수 재정의 (구 시그니처 삭제 후 zone/seat_number 기반으로 재작성)
-- ============================================================

drop function if exists enter_table(integer);

create or replace function enter_table(p_zone text, p_seat_number integer)
returns dining_table
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table dining_table;
begin
  select * into v_table from dining_table where zone = p_zone and seat_number = p_seat_number;
  if not found then
    raise exception 'unknown table: % %', p_zone, p_seat_number;
  end if;

  if v_table.status = 'EMPTY' then
    update dining_table
      set status = 'OCCUPIED', entered_at = now()
      where id = v_table.id
      returning * into v_table;
  end if;

  return v_table;
end;
$$;

revoke execute on function enter_table(text, integer) from public;
grant execute on function enter_table(text, integer) to anon, authenticated;

drop function if exists create_order(integer, jsonb);

create or replace function create_order(p_zone text, p_seat_number integer, p_items jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table_id bigint;
  v_order_id bigint;
  v_item jsonb;
begin
  select id into v_table_id from dining_table where zone = p_zone and seat_number = p_seat_number;
  if v_table_id is null then
    raise exception 'unknown table: % %', p_zone, p_seat_number;
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'order must contain at least one item';
  end if;

  insert into orders (table_id, payment_confirmed)
    values (v_table_id, false)
    returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into order_item (order_id, menu_item_id, quantity, status)
    values (
      v_order_id,
      (v_item->>'menu_item_id')::bigint,
      (v_item->>'quantity')::integer,
      'PENDING_PAYMENT'
    );
  end loop;

  return v_order_id;
end;
$$;

revoke execute on function create_order(text, integer, jsonb) from public;
grant execute on function create_order(text, integer, jsonb) to anon, authenticated;

drop function if exists checkout_table(integer);

create or replace function checkout_table(p_zone text, p_seat_number integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table_id bigint;
begin
  if not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  select id into v_table_id from dining_table where zone = p_zone and seat_number = p_seat_number;
  if v_table_id is null then
    raise exception 'unknown table: % %', p_zone, p_seat_number;
  end if;

  delete from orders where table_id = v_table_id;

  update dining_table
    set status = 'EMPTY', entered_at = null
    where id = v_table_id;
end;
$$;

revoke execute on function checkout_table(text, integer) from public, anon;
grant execute on function checkout_table(text, integer) to authenticated;

drop function if exists add_dining_table(integer);

create or replace function add_dining_table(p_zone text, p_seat_number integer)
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

  insert into dining_table (zone, seat_number, status)
    values (p_zone, p_seat_number, 'EMPTY')
    returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function add_dining_table(text, integer) from public, anon;
grant execute on function add_dining_table(text, integer) to authenticated;

-- 관리자: 테이블(좌석) 이동 — 물리적으로 자리를 옮겼을 때 라벨만 바꿔준다.
-- id(및 그 테이블에 연결된 주문)는 그대로 유지되므로 진행 중인 주문에 영향 없음.
-- 목적지 라벨이 이미 다른 테이블이 쓰고 있으면 unique 제약으로 에러가 난다.
create or replace function move_dining_table(
  p_zone text,
  p_seat_number integer,
  p_new_zone text,
  p_new_seat_number integer
)
returns dining_table
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table dining_table;
begin
  if not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  update dining_table
    set zone = p_new_zone, seat_number = p_new_seat_number
    where zone = p_zone and seat_number = p_seat_number
    returning * into v_table;

  if not found then
    raise exception 'unknown table: % %', p_zone, p_seat_number;
  end if;

  return v_table;
end;
$$;

revoke execute on function move_dining_table(text, integer, text, integer) from public, anon;
grant execute on function move_dining_table(text, integer, text, integer) to authenticated;

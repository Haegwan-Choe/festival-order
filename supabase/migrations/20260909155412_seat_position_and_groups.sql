-- 좌석 드래그 배치(위치)와 합석(그룹) 기능 추가.
--
-- 중요: zone/seat_number는 테이블의 "정체성"(QR코드·주문에 연결된 라벨)이라
-- 절대 바뀌지 않는다. 드래그로 옮기는 건 화면상 "위치"(grid_row/grid_col)만
-- 바꾸는 것 — move_dining_table의 의미를 "라벨 변경"에서 "위치 변경"으로 재정의한다.

alter table dining_table
  add column grid_row integer not null default 0,
  add column grid_col integer not null default 0,
  add column group_id bigint references dining_table(id);

-- 아직 실사용 데이터가 없는 개발 단계라 기존 데이터는 비우고 재시딩
truncate table order_item, orders, dining_table restart identity cascade;

alter table dining_table
  add constraint dining_table_zone_position_key unique (zone, grid_row, grid_col);

-- ============================================================
-- move_dining_table: 라벨(zone/seat_number)은 그대로 두고 위치만 이동
-- ============================================================
drop function if exists move_dining_table(text, integer, text, integer);

create or replace function move_dining_table(
  p_zone text,
  p_seat_number integer,
  p_new_row integer,
  p_new_col integer
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
    set grid_row = p_new_row, grid_col = p_new_col
    where zone = p_zone and seat_number = p_seat_number
    returning * into v_table;

  if not found then
    raise exception 'unknown table: % %', p_zone, p_seat_number;
  end if;

  return v_table;
end;
$$;

revoke execute on function move_dining_table(text, integer, integer, integer) from public, anon;
grant execute on function move_dining_table(text, integer, integer, integer) to authenticated;

-- ============================================================
-- add_dining_table: 생성 시 위치도 함께 지정
-- ============================================================
drop function if exists add_dining_table(text, integer);

create or replace function add_dining_table(
  p_zone text,
  p_seat_number integer,
  p_grid_row integer,
  p_grid_col integer
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

  insert into dining_table (zone, seat_number, status, grid_row, grid_col)
    values (p_zone, p_seat_number, 'EMPTY', p_grid_row, p_grid_col)
    returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function add_dining_table(text, integer, integer, integer) from public, anon;
grant execute on function add_dining_table(text, integer, integer, integer) to authenticated;

-- ============================================================
-- checkout_table: 퇴석 시 그룹 소속도 함께 해제
-- ============================================================
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
    set status = 'EMPTY', entered_at = null, group_id = null
    where id = v_table_id;
end;
$$;

-- ============================================================
-- merge_tables: 합석 — 화면 표시용 그룹 묶기 (주문/결제는 테이블별 독립 유지)
-- p_tables 예시: [{"zone":"A","seat_number":1},{"zone":"A","seat_number":2}]
-- 그룹의 입장 시각은 이미 앉아있던 테이블 중 가장 먼저 입장한 시각을 따른다.
-- ============================================================
create or replace function merge_tables(p_tables jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids bigint[] := '{}';
  v_anchor_id bigint;
  v_anchor_entered_at timestamptz;
  v_item jsonb;
  v_id bigint;
begin
  if not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  if p_tables is null or jsonb_array_length(p_tables) < 2 then
    raise exception 'merge requires at least 2 tables';
  end if;

  for v_item in select * from jsonb_array_elements(p_tables)
  loop
    select id into v_id
      from dining_table
      where zone = (v_item->>'zone') and seat_number = (v_item->>'seat_number')::integer;

    if v_id is null then
      raise exception 'unknown table: % %', v_item->>'zone', v_item->>'seat_number';
    end if;

    v_ids := array_append(v_ids, v_id);
  end loop;

  select id, entered_at into v_anchor_id, v_anchor_entered_at
    from dining_table
    where id = any(v_ids) and entered_at is not null
    order by entered_at asc
    limit 1;

  if v_anchor_id is null then
    v_anchor_id := v_ids[1];
    v_anchor_entered_at := now();
  end if;

  update dining_table
    set group_id = v_anchor_id,
        status = 'OCCUPIED',
        entered_at = v_anchor_entered_at
    where id = any(v_ids);
end;
$$;

revoke execute on function merge_tables(jsonb) from public, anon;
grant execute on function merge_tables(jsonb) to authenticated;

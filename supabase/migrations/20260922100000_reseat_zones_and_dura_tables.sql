-- 테이블 재배치 (행사 준비 중 배치 확정)
-- - A구역: 3블록 구성을 10석/8석/8석으로 (가운데 블록에 2석 추가 → 총 24석 → 26석)
-- - B구역: 오른쪽 8석 블록을 2행 아래로 내리고, 비워진 자리에 듀라테이블(일반 테이블보다 큼) 3개 추가
-- PROJECT.md 3장 데이터 모델 참고. 실제 배치는 관리자 총괄 화면(SeatGrid)에서 드래그로 추가 조정 가능.

-- ============================================================
-- 0. 테이블 종류(table_type) 추가 — 일반/듀라 구분용. 듀라는 관리자 화면에서 더 크게 표시된다.
-- ============================================================
create type dining_table_type as enum ('NORMAL', 'DURA');

alter table dining_table
  add column table_type dining_table_type not null default 'NORMAL';

-- ============================================================
-- 1~2. 기존 운영 데이터에 대한 1회성 재배치.
--    이미 좌석이 있는(=운영 중인) DB에서만 실행한다 — 로컬에서 db reset으로 새로
--    만든 빈 DB라면 이 블록을 건너뛰고, 뒤이어 실행되는 seed.sql이 최종 배치를
--    바로 시딩한다 (그래서 여기서 만드는 seat_number/좌표와 seed.sql이 겹치지 않음).
-- ============================================================
do $$
begin
  if exists (select 1 from dining_table) then
    -- 1. A구역: 가운데 블록(기존 6석, col 6-8)을 col 9까지 넓혀서 8석으로.
    --    오른쪽 블록(기존 col 10-13)은 한 칸씩 밀어서 col 11-14로 이동.
    --    (zone, grid_row, grid_col) unique 제약 때문에 자기 자신과 충돌 없이 밀어내려고
    --    일단 먼 음수 좌표로 옮겼다가 최종 위치로 되돌리는 2단계로 처리한다.
    update dining_table
      set grid_col = grid_col - 1000
      where zone = 'A' and grid_row in (0, 1) and grid_col between 10 and 13;

    update dining_table
      set grid_col = grid_col + 1001
      where zone = 'A' and grid_row in (0, 1) and grid_col between -990 and -987;

    -- 새 테이블 2개(25, 26) — 가운데 블록의 새 칸(col 9)에 추가
    insert into dining_table (zone, seat_number, status, grid_row, grid_col) values
      ('A', 25, 'EMPTY', 0, 9),
      ('A', 26, 'EMPTY', 1, 9);

    -- 2. B구역: 오른쪽 8석 블록(col 5-8, row 0-1)을 2행 아래(row 2-3)로 이동.
    --    왼쪽 8석 블록(col 2-3, row 0-3)은 그대로 유지.
    --    row 0(col 5-8)이 비므로 듀라테이블 3개를 한 칸씩 띄워서(col 5, 7, 9) 배치.
    update dining_table
      set grid_row = grid_row + 2
      where zone = 'B' and grid_row in (0, 1) and grid_col between 5 and 8;

    insert into dining_table (zone, seat_number, status, grid_row, grid_col, table_type) values
      ('B', 17, 'EMPTY', 0, 5, 'DURA'),
      ('B', 18, 'EMPTY', 0, 7, 'DURA'),
      ('B', 19, 'EMPTY', 0, 9, 'DURA');
  end if;
end;
$$;

-- ============================================================
-- 3. add_dining_table: 이후 관리자가 테이블을 더 추가할 때 종류도 지정할 수 있도록 확장
--    (p_table_type 생략 시 기본 'NORMAL' — 기존 호출부 호환)
-- ============================================================
drop function if exists add_dining_table(text, integer, integer, integer);

create or replace function add_dining_table(
  p_zone text,
  p_seat_number integer,
  p_grid_row integer,
  p_grid_col integer,
  p_table_type dining_table_type default 'NORMAL'
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

  insert into dining_table (zone, seat_number, status, grid_row, grid_col, table_type)
    values (p_zone, p_seat_number, 'EMPTY', p_grid_row, p_grid_col, p_table_type)
    returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function add_dining_table(text, integer, integer, integer, dining_table_type) from public, anon;
grant execute on function add_dining_table(text, integer, integer, integer, dining_table_type) to authenticated;

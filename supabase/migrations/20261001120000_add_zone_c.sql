-- C구역 신설: 6석. 현장에서는 A구역과 B구역 사이에 위치한다
-- (총괄 화면 표시 순서는 프론트 ZONE_ORDER에서 A → C → B로 지정).
-- 배치는 6석 한 줄, 실제 위치는 총괄 화면(SeatGrid)에서 드래그로 조정 가능.
--
-- 운영 DB와 로컬(db reset) 양쪽에서 그대로 실행된다 — seed.sql은 A/B구역만 넣으므로 겹치지 않음.
insert into dining_table (zone, seat_number, status, grid_row, grid_col) values
  ('C', 1, 'EMPTY', 0, 0), ('C', 2, 'EMPTY', 0, 1), ('C', 3, 'EMPTY', 0, 2),
  ('C', 4, 'EMPTY', 0, 3), ('C', 5, 'EMPTY', 0, 4), ('C', 6, 'EMPTY', 0, 5)
on conflict (zone, seat_number) do nothing;

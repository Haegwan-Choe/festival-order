-- 로컬 개발/테스트용 시드 데이터
-- 실제 행사용 테이블 수/메뉴는 운영진과 확정 후 별도로 채워 넣을 것

-- 테이블 배치 확정본 (2026-09-22 기준, migrations/20260922100000_reseat_zones_and_dura_tables.sql와 동일 구조)
-- 총 45석: A구역 26석(10+8+8 3블록), B구역 19석(일반 16 + 듀라 3)
-- 블록 사이 grid_col을 한 칸 띄워서 통로처럼 보이게 함
insert into dining_table (zone, seat_number, status, grid_row, grid_col) values
  -- A구역: 블록1(1-10, col 0-4), 블록2(11-18, col 6-9), 블록3(19-26, col 11-14)
  ('A', 1, 'EMPTY', 0, 0), ('A', 2, 'EMPTY', 0, 1), ('A', 3, 'EMPTY', 0, 2), ('A', 4, 'EMPTY', 0, 3), ('A', 5, 'EMPTY', 0, 4),
  ('A', 6, 'EMPTY', 1, 0), ('A', 7, 'EMPTY', 1, 1), ('A', 8, 'EMPTY', 1, 2), ('A', 9, 'EMPTY', 1, 3), ('A', 10, 'EMPTY', 1, 4),
  ('A', 11, 'EMPTY', 0, 6), ('A', 12, 'EMPTY', 0, 7), ('A', 13, 'EMPTY', 0, 8), ('A', 14, 'EMPTY', 0, 9),
  ('A', 15, 'EMPTY', 1, 6), ('A', 16, 'EMPTY', 1, 7), ('A', 17, 'EMPTY', 1, 8), ('A', 18, 'EMPTY', 1, 9),
  ('A', 19, 'EMPTY', 0, 11), ('A', 20, 'EMPTY', 0, 12), ('A', 21, 'EMPTY', 0, 13), ('A', 22, 'EMPTY', 0, 14),
  ('A', 23, 'EMPTY', 1, 11), ('A', 24, 'EMPTY', 1, 12), ('A', 25, 'EMPTY', 1, 13), ('A', 26, 'EMPTY', 1, 14),
  -- B구역: 왼쪽 블록(1-8, col 2-3, row 0-3), 오른쪽 블록(9-16, col 5-8, row 2-3, 위쪽엔 듀라테이블 공간)
  ('B', 1, 'EMPTY', 0, 2), ('B', 2, 'EMPTY', 0, 3),
  ('B', 3, 'EMPTY', 1, 2), ('B', 4, 'EMPTY', 1, 3),
  ('B', 5, 'EMPTY', 2, 2), ('B', 6, 'EMPTY', 2, 3),
  ('B', 7, 'EMPTY', 3, 2), ('B', 8, 'EMPTY', 3, 3),
  ('B', 9, 'EMPTY', 2, 5), ('B', 10, 'EMPTY', 2, 6), ('B', 11, 'EMPTY', 2, 7), ('B', 12, 'EMPTY', 2, 8),
  ('B', 13, 'EMPTY', 3, 5), ('B', 14, 'EMPTY', 3, 6), ('B', 15, 'EMPTY', 3, 7), ('B', 16, 'EMPTY', 3, 8);

-- B구역 듀라테이블(일반 테이블보다 큼) 3개 — 오른쪽 블록을 내려서 비운 row 0에 한 칸씩 띄워 배치
insert into dining_table (zone, seat_number, status, grid_row, grid_col, table_type) values
  ('B', 17, 'EMPTY', 0, 5, 'DURA'),
  ('B', 18, 'EMPTY', 0, 7, 'DURA'),
  ('B', 19, 'EMPTY', 0, 9, 'DURA');

-- 샘플 메뉴 (카테고리: 안주 / 사이드 / 밈)
insert into menu_item (name, price, category, available) values
  ('떡볶이', 15000, '안주', true),
  ('순대', 13000, '안주', true),
  ('튀김모듬', 15000, '안주', true),
  ('치킨', 18000, '안주', true),
  ('사이다', 2000, '밈', true),
  ('콜라', 2000, '밈', true),
  ('생수', 1000, '밈', true),
  ('감자튀김', 8000, '사이드', true);

-- admins 시드는 넣지 않음: auth.users에 실제 계정이 먼저 생성돼야
-- admins.id(FK)를 채울 수 있음. Supabase Auth로 계정을 만든 뒤
--   insert into admins (id, display_name) values ('<auth.users의 uuid>', '표시이름');
-- 형태로 수동 등록할 것.

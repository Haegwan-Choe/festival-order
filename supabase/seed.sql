-- 로컬 개발/테스트용 시드 데이터
-- 실제 행사용 테이블 수/메뉴는 운영진과 확정 후 별도로 채워 넣을 것

-- 테이블 배치 1차 시안 기준 (확정 아님, 손그림 사진 참고 — 나중에 바뀌면 이 블록만 다시 채우면 됨)
-- 총 40석: A구역 24석(2열 x 3블록), B구역 16석(2열 x 2블록)
-- 블록 사이 grid_col을 한 칸 띄워서 통로처럼 보이게 함
insert into dining_table (zone, seat_number, status, grid_row, grid_col) values
  -- A구역: 블록1(1-4 / 13-16), 블록2(5-8 / 17-20), 블록3(9-12 / 21-24)
  ('A', 1, 'EMPTY', 0, 0), ('A', 2, 'EMPTY', 0, 1), ('A', 3, 'EMPTY', 0, 2), ('A', 4, 'EMPTY', 0, 3),
  ('A', 5, 'EMPTY', 0, 5), ('A', 6, 'EMPTY', 0, 6), ('A', 7, 'EMPTY', 0, 7), ('A', 8, 'EMPTY', 0, 8),
  ('A', 9, 'EMPTY', 0, 10), ('A', 10, 'EMPTY', 0, 11), ('A', 11, 'EMPTY', 0, 12), ('A', 12, 'EMPTY', 0, 13),
  ('A', 13, 'EMPTY', 1, 0), ('A', 14, 'EMPTY', 1, 1), ('A', 15, 'EMPTY', 1, 2), ('A', 16, 'EMPTY', 1, 3),
  ('A', 17, 'EMPTY', 1, 5), ('A', 18, 'EMPTY', 1, 6), ('A', 19, 'EMPTY', 1, 7), ('A', 20, 'EMPTY', 1, 8),
  ('A', 21, 'EMPTY', 1, 10), ('A', 22, 'EMPTY', 1, 11), ('A', 23, 'EMPTY', 1, 12), ('A', 24, 'EMPTY', 1, 13),
  -- B구역: 왼쪽 블록(1-4 / 9-12), 오른쪽 블록(5-8 / 13-16)
  ('B', 1, 'EMPTY', 1, 0), ('B', 2, 'EMPTY', 1, 1), ('B', 3, 'EMPTY', 1, 2), ('B', 4, 'EMPTY', 1, 3),
  ('B', 5, 'EMPTY', 1, 5), ('B', 6, 'EMPTY', 1, 6), ('B', 7, 'EMPTY', 1, 7), ('B', 8, 'EMPTY', 1, 8),
  ('B', 9, 'EMPTY', 0, 0), ('B', 10, 'EMPTY', 0, 1), ('B', 11, 'EMPTY', 0, 2), ('B', 12, 'EMPTY', 0, 3),
  ('B', 13, 'EMPTY', 0, 5), ('B', 14, 'EMPTY', 0, 6), ('B', 15, 'EMPTY', 0, 7), ('B', 16, 'EMPTY', 0, 8);

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

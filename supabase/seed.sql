-- 로컬 개발/테스트용 시드 데이터
-- 실제 행사용 테이블 수/메뉴는 운영진과 확정 후 별도로 채워 넣을 것

-- 테이블 50개 (1~50번, 전부 EMPTY 상태로 시작)
insert into dining_table (table_number, status)
select generate_series(1, 50), 'EMPTY';

-- 샘플 메뉴 (카테고리: 안주 / 음료 / 사이드)
insert into menu_item (name, price, category, available) values
  ('떡볶이', 15000, '안주', true),
  ('순대', 13000, '안주', true),
  ('튀김모듬', 15000, '안주', true),
  ('치킨', 18000, '안주', true),
  ('사이다', 2000, '음료', true),
  ('콜라', 2000, '음료', true),
  ('생수', 1000, '음료', true),
  ('감자튀김', 8000, '사이드', true);

-- admins 시드는 넣지 않음: auth.users에 실제 계정이 먼저 생성돼야
-- admins.id(FK)를 채울 수 있음. Supabase Auth로 계정을 만든 뒤
--   insert into admins (id, display_name) values ('<auth.users의 uuid>', '표시이름');
-- 형태로 수동 등록할 것.

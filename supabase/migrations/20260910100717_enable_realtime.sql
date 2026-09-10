-- 프론트에서 postgres_changes로 구독하는 테이블들을 supabase_realtime
-- publication에 등록. 이게 안 되어 있으면 RLS/구독 코드가 다 맞아도
-- 변경사항이 전혀 브로드캐스트되지 않아 새로고침해야만 반영된다.
alter publication supabase_realtime add table dining_table;
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_item;

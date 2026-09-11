-- served_at 컬럼 추가 이전(또는 어떤 이유로든 served_at 없이) SERVED로 표시된
-- 기존 항목들은 완료 시각이 없어서 큐 자동 숨김 로직이 절대 발동하지 않았음.
-- 지금 시각으로 채워서 정상적으로 사라지도록 백필.
update order_item set served_at = now() where status = 'SERVED' and served_at is null;

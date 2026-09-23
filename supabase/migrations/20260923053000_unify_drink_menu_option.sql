-- 손님 메뉴 화면 개편: 메뉴 탭을 하나로 통일하고, '밈'(음료) 카테고리는 더 이상 개별로
-- 담는 메뉴가 아니라 장바구니에서 한 번만 고르는 라디오 옵션이 됨(프론트: CartView).
-- 기존 개별 음료(사이다/콜라/생수 등)는 감추고, 옵션은 '단체 밈' 하나로 통일.
-- 안주 카테고리 메뉴는 운영진이 직접 관리자 화면에서 편집 — 여기서 건드리지 않음.
--
-- 아래는 이미 메뉴 데이터가 있는(=운영 중인) DB에 대한 1회성 정리다. 로컬에서 db reset으로
-- 새로 만든 빈 DB라면 건너뛰고, 뒤이어 실행되는 seed.sql이 최종 메뉴를 바로 시딩한다
-- (안 그러면 이 마이그레이션의 insert와 seed.sql의 insert가 겹쳐서 '단체 밈'이 중복 생성됨).
do $$
begin
  if exists (select 1 from menu_item) then
    -- 기존 밈 카테고리 항목들은 삭제하지 않고 감춤(available=false) — 이미 걸린 과거 주문의 FK 무결성 보존.
    update menu_item set available = false where category = '밈';

    -- '단체 밈'이 아직 없을 때만 추가 (재실행 안전).
    insert into menu_item (name, price, category, available)
    select '단체 밈', 9900, '밈', true
    where not exists (
      select 1 from menu_item where category = '밈' and name = '단체 밈'
    );

    -- 혹시 예전에 이미 '단체 밈'이 들어가 있었다면(비활성 상태 등) 최신 가격/판매 상태로 맞춰줌.
    update menu_item
      set price = 9900, available = true
      where category = '밈' and name = '단체 밈';
  end if;
end;
$$;

-- 메뉴 카테고리를 "안주 / 사이드 / 밈"(부스 이름 "밈천지"에 맞춘 음료 카테고리명)으로 정리
update menu_item set category = '밈' where category = '음료';

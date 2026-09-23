-- 메뉴 관리 화면에 실제 삭제 버튼 추가. 기존에는 available=false(품절)로만 감추는 정책이었는데
-- (PROJECT.md 4장 참고), 운영진 요청으로 하드 삭제 RPC를 추가한다.
--
-- order_item.menu_item_id가 이 메뉴를 참조 중이면(=아직 퇴석 안 한 주문에 걸려있으면) FK 제약으로
-- 자동 차단된다 — checkout_table은 주문을 지우면서 order_log에 스냅샷만 남기므로, 퇴석이 끝난
-- 메뉴는 참조가 없어져 삭제 가능해진다. 즉 "진행 중인 주문에 걸린 메뉴는 못 지움"이 DB 레벨에서
-- 자연히 보장된다 — 별도 체크 코드 불필요.
create or replace function delete_menu_item(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  delete from menu_item where id = p_id;
end;
$$;

revoke execute on function delete_menu_item(bigint) from public, anon;
grant execute on function delete_menu_item(bigint) to authenticated;

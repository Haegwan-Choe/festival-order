-- 관리자 큐에서 완료된 주문 카드를 수동으로 치우는 기능(X 버튼).
-- 주문 데이터는 삭제하지 않고 dismissed_at만 기록 — 모든 기기에서 같이 사라지고
-- 새로고침해도 유지되며, 고객 주문 현황 화면에는 영향 없음. 퇴석 시 orders가
-- 삭제되는 기존 동작도 그대로.
alter table orders add column dismissed_at timestamptz;

create or replace function dismiss_order(p_order_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  if exists (
    select 1 from order_item
    where order_id = p_order_id and status <> 'SERVED'
  ) then
    raise exception 'order is not fully served';
  end if;

  update orders
    set dismissed_at = now()
    where id = p_order_id and dismissed_at is null;
end;
$$;

revoke execute on function dismiss_order(bigint) from public, anon;
grant execute on function dismiss_order(bigint) to authenticated;

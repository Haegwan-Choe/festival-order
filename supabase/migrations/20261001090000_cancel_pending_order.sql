-- 입금 확인 전(PENDING_PAYMENT) 주문 취소 기능. 손님이 잘못 주문했거나 마음을 바꿨을 때
-- 관리자가 주문 전체(일괄 삭제) 또는 메뉴 한 줄만 지울 수 있게 한다.
--
-- 아직 돈이 오가기 전이므로 order_log에 남기지 않고 그냥 하드 삭제한다.
-- 입금 확인과 동시에 눌리는 경우를 막기 위해 orders 행을 FOR UPDATE로 잠근 뒤 상태를 확인한다
-- (confirm_payment도 같은 orders 행을 UPDATE하므로 둘 중 하나는 대기 후 바뀐 상태를 보게 됨).

-- 관리자: 주문 전체 취소 (입금 확인 전에만)
create or replace function cancel_order(p_order_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment_confirmed boolean;
begin
  if not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  select payment_confirmed into v_payment_confirmed
    from orders where id = p_order_id
    for update;

  if not found then
    raise exception 'order not found';
  end if;

  if v_payment_confirmed then
    raise exception 'order is already paid';
  end if;

  -- order_item은 on delete cascade로 같이 삭제됨
  delete from orders where id = p_order_id;
end;
$$;

revoke execute on function cancel_order(bigint) from public, anon;
grant execute on function cancel_order(bigint) to authenticated;

-- 관리자: 주문 안의 메뉴 한 줄 취소 (입금 확인 전에만). 마지막 한 줄이었으면 주문도 같이 삭제.
create or replace function cancel_order_item(p_item_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id bigint;
begin
  if not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  select order_id into v_order_id from order_item where id = p_item_id;
  if v_order_id is null then
    raise exception 'order item not found';
  end if;

  -- 부모 주문을 먼저 잠가서 confirm_payment와 직렬화
  perform 1 from orders where id = v_order_id for update;

  delete from order_item
    where id = p_item_id and status = 'PENDING_PAYMENT';

  if not found then
    raise exception 'order item is already paid';
  end if;

  if not exists (select 1 from order_item where order_id = v_order_id) then
    delete from orders where id = v_order_id;
  end if;
end;
$$;

revoke execute on function cancel_order_item(bigint) from public, anon;
grant execute on function cancel_order_item(bigint) to authenticated;

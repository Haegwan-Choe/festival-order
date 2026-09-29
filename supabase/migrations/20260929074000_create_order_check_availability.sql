-- 버그 수정: create_order가 menu_item.available을 전혀 확인하지 않아서, 손님이 메뉴 화면을
-- 켜놓은 사이 관리자가 품절 처리해도(또는 메뉴가 삭제돼도) 그대로 주문이 들어갈 수 있었음.
-- 손님 쪽 메뉴 목록은 실시간 구독이 아니라 한 번만 불러오기 때문에 이 틈이 더 클 수 있음.
--
-- 주문 생성 전에 항목 전체를 먼저 검증(존재 + available=true)하고, 하나라도 걸리면 주문
-- 자체를 만들지 않는다(부분 주문 방지).
create or replace function create_order(p_zone text, p_seat_number integer, p_items jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table_id bigint;
  v_order_id bigint;
  v_item jsonb;
  v_menu_id bigint;
  v_menu_name text;
  v_available boolean;
begin
  select id into v_table_id from dining_table where zone = p_zone and seat_number = p_seat_number;
  if v_table_id is null then
    raise exception 'unknown table: % %', p_zone, p_seat_number;
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'order must contain at least one item';
  end if;

  -- 1차: 전체 항목 검증 (존재 여부 + 품절 여부)
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_menu_id := (v_item->>'menu_item_id')::bigint;

    select name, available into v_menu_name, v_available
      from menu_item where id = v_menu_id;

    if v_menu_name is null then
      raise exception 'unknown menu item: %', v_menu_id;
    end if;

    if not v_available then
      raise exception 'menu item no longer available: %', v_menu_name;
    end if;
  end loop;

  -- 2차: 검증 통과했을 때만 실제 생성
  insert into orders (table_id, payment_confirmed)
    values (v_table_id, false)
    returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into order_item (order_id, menu_item_id, quantity, status)
    values (
      v_order_id,
      (v_item->>'menu_item_id')::bigint,
      (v_item->>'quantity')::integer,
      'PENDING_PAYMENT'
    );
  end loop;

  return v_order_id;
end;
$$;

revoke execute on function create_order(text, integer, jsonb) from public;
grant execute on function create_order(text, integer, jsonb) to anon, authenticated;

-- 퇴석 시 주문은 그대로 삭제하되(손님 화면/큐 로직 유지), 삭제 직전에 이 테이블에
-- 스냅샷을 복사해서 정산/사후 확인용 기록을 남긴다. 기록은 관리자만 조회 가능하고,
-- 쓰기는 checkout_table(SECURITY DEFINER)로만 이뤄진다.
--
-- 메뉴명/가격은 퇴석 시점 값으로 스냅샷한다 (이후 메뉴 수정과 무관하게 기록 유지).
create table order_log (
  id bigint generated always as identity primary key,
  zone text not null,
  seat_number integer not null,
  table_entered_at timestamptz,
  checked_out_at timestamptz not null default now(),
  order_id bigint not null,
  ordered_at timestamptz not null,
  payment_confirmed boolean not null,
  items jsonb not null,
  total_amount integer not null
);

create index order_log_checked_out_at_idx on order_log (checked_out_at desc);

alter table order_log enable row level security;

create policy "admins read order_log" on order_log for select
  using (exists (select 1 from admins where id = auth.uid()));

-- insert/update/delete 정책은 의도적으로 만들지 않는다 (기본 차단).

create or replace function checkout_table(p_zone text, p_seat_number integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table dining_table;
begin
  if not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  select * into v_table from dining_table where zone = p_zone and seat_number = p_seat_number;
  if not found then
    raise exception 'unknown table: % %', p_zone, p_seat_number;
  end if;

  insert into order_log (
    zone, seat_number, table_entered_at, order_id, ordered_at, payment_confirmed, items, total_amount
  )
  select
    v_table.zone,
    v_table.seat_number,
    v_table.entered_at,
    o.id,
    o.created_at,
    o.payment_confirmed,
    jsonb_agg(
      jsonb_build_object(
        'menu_name', m.name,
        'price', m.price,
        'quantity', oi.quantity,
        'status', oi.status,
        'served_at', oi.served_at
      ) order by oi.id
    ),
    sum(m.price * oi.quantity)::integer
  from orders o
  join order_item oi on oi.order_id = o.id
  join menu_item m on m.id = oi.menu_item_id
  where o.table_id = v_table.id
  group by o.id;

  delete from orders where table_id = v_table.id;

  update dining_table
    set status = 'EMPTY', entered_at = null, group_id = null
    where id = v_table.id;
end;
$$;

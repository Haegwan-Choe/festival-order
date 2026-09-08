-- 학교 축제 주점 주문 시스템 — 초기 스키마
-- PROJECT.md 3~6장(데이터 모델 / RLS / RPC) 참고

-- ============================================================
-- 1. Enum 타입
-- ============================================================
create type table_status as enum ('EMPTY', 'OCCUPIED');
create type order_item_status as enum ('PENDING_PAYMENT', 'COOKING', 'SERVED');

-- ============================================================
-- 2. 테이블
-- ============================================================
create table dining_table (
  id bigint generated always as identity primary key,
  table_number integer not null unique,
  status table_status not null default 'EMPTY',
  entered_at timestamptz
);

create table menu_item (
  id bigint generated always as identity primary key,
  name text not null,
  price integer not null check (price >= 0),
  category text not null,
  available boolean not null default true
);

create table orders (
  id bigint generated always as identity primary key,
  table_id bigint not null references dining_table(id),
  created_at timestamptz not null default now(),
  payment_confirmed boolean not null default false
);

create table order_item (
  id bigint generated always as identity primary key,
  order_id bigint not null references orders(id) on delete cascade,
  menu_item_id bigint not null references menu_item(id),
  quantity integer not null check (quantity > 0),
  status order_item_status not null default 'PENDING_PAYMENT'
);

-- 로그인 자격증명은 Supabase Auth(auth.users)가 전담. 이 테이블은
-- "이 Auth 유저가 관리자다"라는 표식 + 표시 이름만 저장한다.
create table admins (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null
);

create index order_table_id_idx on orders(table_id);
create index order_item_order_id_idx on order_item(order_id);
create index order_item_menu_item_id_idx on order_item(menu_item_id);

-- ============================================================
-- 3. RLS: 조회는 공개, 쓰기는 전부 차단 (RPC 함수로만 가능)
-- ============================================================
alter table dining_table enable row level security;
alter table menu_item enable row level security;
alter table orders enable row level security;
alter table order_item enable row level security;
alter table admins enable row level security;

-- 민감정보가 아니므로 anon 포함 누구나 조회 가능
create policy "read dining_table" on dining_table for select using (true);
create policy "read menu_item" on menu_item for select using (true);
create policy "read orders" on orders for select using (true);
create policy "read order_item" on order_item for select using (true);

-- admins는 "내가 관리자인지" 스스로 확인하는 용도로만 자기 행 조회 허용
create policy "read own admin row" on admins for select using (auth.uid() = id);

-- insert/update/delete 정책은 의도적으로 만들지 않는다 (기본값 = 전면 차단).
-- 모든 상태 변경은 아래 SECURITY DEFINER 함수를 통해서만 이뤄진다.

-- ============================================================
-- 4. RPC 함수
-- ============================================================

-- 고객: 테이블 최초 입장 처리 (EMPTY -> OCCUPIED, entered_at 기록)
create or replace function enter_table(p_table_number integer)
returns dining_table
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table dining_table;
begin
  select * into v_table from dining_table where table_number = p_table_number;
  if not found then
    raise exception 'unknown table number: %', p_table_number;
  end if;

  if v_table.status = 'EMPTY' then
    update dining_table
      set status = 'OCCUPIED', entered_at = now()
      where id = v_table.id
      returning * into v_table;
  end if;

  return v_table;
end;
$$;

-- PostgreSQL은 함수 생성 시 PUBLIC(anon 포함 모든 롤)에 EXECUTE를 기본으로 부여하므로,
-- 의도한 롤 조합만 남기려면 반드시 명시적으로 revoke 후 grant해야 한다.
revoke execute on function enter_table(integer) from public;
grant execute on function enter_table(integer) to anon, authenticated;

-- 고객: 주문 생성. p_items 예시: [{"menu_item_id": 1, "quantity": 2}, ...]
-- status는 항상 서버가 PENDING_PAYMENT로 강제 (클라이언트가 임의 상태로 생성 불가)
create or replace function create_order(p_table_number integer, p_items jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table_id bigint;
  v_order_id bigint;
  v_item jsonb;
begin
  select id into v_table_id from dining_table where table_number = p_table_number;
  if v_table_id is null then
    raise exception 'unknown table number: %', p_table_number;
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'order must contain at least one item';
  end if;

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

revoke execute on function create_order(integer, jsonb) from public;
grant execute on function create_order(integer, jsonb) to anon, authenticated;

-- 관리자: 입금 확인 -> 하위 order_item 전체 PENDING_PAYMENT -> COOKING
create or replace function confirm_payment(p_order_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  update orders set payment_confirmed = true where id = p_order_id;

  update order_item
    set status = 'COOKING'
    where order_id = p_order_id and status = 'PENDING_PAYMENT';
end;
$$;

-- supabase는 새 함수 생성 시 anon/authenticated에 기본으로 EXECUTE를 부여하므로,
-- anon을 명시적으로 빼야 실제로 막힌다 (public revoke만으로는 부족함 — 로컬 스택에서 직접 확인됨).
revoke execute on function confirm_payment(bigint) from public, anon;
grant execute on function confirm_payment(bigint) to authenticated;

-- 관리자: 개별 항목 조리 완료 (COOKING -> SERVED)
create or replace function serve_item(p_item_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  update order_item set status = 'SERVED' where id = p_item_id and status = 'COOKING';
end;
$$;

revoke execute on function serve_item(bigint) from public, anon;
grant execute on function serve_item(bigint) to authenticated;

-- 관리자(총괄): 퇴석 처리 -> 주문 내역 정리 + 좌석 EMPTY로 초기화
-- 화면상 "총괄 전용" 버튼이지만, DB 레벨에서는 다른 admin 함수와 동일하게
-- admins 등록 여부만 확인한다 (역할 세분화는 PROJECT.md 8장 확장성 메모 참고).
create or replace function checkout_table(p_table_number integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table_id bigint;
begin
  if not exists (select 1 from admins where id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  select id into v_table_id from dining_table where table_number = p_table_number;
  if v_table_id is null then
    raise exception 'unknown table number: %', p_table_number;
  end if;

  delete from orders where table_id = v_table_id;

  update dining_table
    set status = 'EMPTY', entered_at = null
    where id = v_table_id;
end;
$$;

revoke execute on function checkout_table(integer) from public, anon;
grant execute on function checkout_table(integer) to authenticated;

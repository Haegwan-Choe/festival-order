-- "완료 후 N분 뒤 자동으로 큐에서 숨김" 처리를 브라우저 로컬 타이머가 아니라
-- 서버에 기록된 시각 기준으로 계산하기 위해 served_at 추가.
-- (로컬 타이머로 하면 새로고침/화면 이동할 때마다 타이머가 리셋되는 버그가 있었음)
alter table order_item add column served_at timestamptz;

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

  update order_item
    set status = 'SERVED', served_at = now()
    where id = p_item_id and status = 'COOKING';
end;
$$;

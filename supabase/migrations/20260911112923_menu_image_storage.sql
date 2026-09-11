-- 메뉴 사진 업로드용 공개 버킷. 조회는 누구나, 업로드/수정/삭제는 관리자만.
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

create policy "public read menu images"
on storage.objects for select
using (bucket_id = 'menu-images');

create policy "admins upload menu images"
on storage.objects for insert
with check (
  bucket_id = 'menu-images'
  and exists (select 1 from admins where id = auth.uid())
);

create policy "admins update menu images"
on storage.objects for update
using (
  bucket_id = 'menu-images'
  and exists (select 1 from admins where id = auth.uid())
);

create policy "admins delete menu images"
on storage.objects for delete
using (
  bucket_id = 'menu-images'
  and exists (select 1 from admins where id = auth.uid())
);

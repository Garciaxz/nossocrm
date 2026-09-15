-- Bucket da biblioteca de midia (SPEC 3.6). Publico porque a Evolution
-- precisa buscar a URL pra anexar a midia na mensagem do WhatsApp.
insert into storage.buckets (id, name, public)
values ('biblioteca', 'biblioteca', true)
on conflict (id) do nothing;

create policy biblioteca_midia_le on storage.objects
  for select using (bucket_id = 'biblioteca');

create policy biblioteca_midia_opera on storage.objects
  for all using (bucket_id = 'biblioteca' and fn_opera_leads())
  with check (bucket_id = 'biblioteca' and fn_opera_leads());

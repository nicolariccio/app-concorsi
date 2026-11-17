-- Foto dei piatti e foto della Home, salvate in un bucket pubblico di Supabase Storage.
alter table piatti add column if not exists foto text not null default '';
alter table locale add column if not exists foto_home text not null default '';

-- Bucket "foto": lettura pubblica via indirizzo; solo JPEG fino a 3 MB. Le scritture passano dal server.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('foto', 'foto', true, 3145728, array['image/jpeg'])
    on conflict (id) do update
      set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
  end if;
end
$$;

-- Tabela dos pedidos de convite (NT-001 §15). Rodar uma vez no SQL Editor do Supabase.
create table public.convites (
  id            bigint generated always as identity primary key,
  criado_em     timestamptz not null default now(),
  nome          text not null check (char_length(nome) between 2 and 120),
  whatsapp      text not null check (whatsapp ~ '^[1-9][1-9](9[0-9]{8}|[2-5][0-9]{7})$'),
  perfil        text not null check (perfil in ('Adestramento','Passeio ou pet sitter','Creche ou hotel','Banho e tosa','Veterinária','Outro')),
  cidade        text not null check (char_length(cidade) between 2 and 120),
  aceite_texto  text not null,
  aceite_em     timestamptz not null default now(),
  pagina        text,
  utm_source    text check (char_length(utm_source) <= 100),
  utm_medium    text check (char_length(utm_medium) <= 100),
  utm_campaign  text check (char_length(utm_campaign) <= 100),
  utm_content   text check (char_length(utm_content) <= 100),
  ref           text check (char_length(ref) <= 100)
);

-- Acesso público fechado: só o Worker, com a chave secreta, grava.
alter table public.convites enable row level security;
revoke all on public.convites from anon, authenticated;
grant usage on schema public to service_role;
grant insert on public.convites to service_role;

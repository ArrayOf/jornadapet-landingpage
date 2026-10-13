-- NT-004. Rodar no SQL Editor ANTES de publicar o Worker que grava codigo_indicacao.

-- Indicação: código aleatório por WhatsApp; índice comum (o único perdia pedidos, NT-004 §2).
alter table public.convites
  add column codigo_indicacao text check (codigo_indicacao ~ '^[a-hjkmnp-z2-9]{8}$');
create index convites_codigo_indicacao on public.convites (codigo_indicacao);

-- Fila: editada à mão no Table Editor.
alter table public.convites
  add column status text not null default 'novo'
    check (status in ('novo', 'chamado', 'convidado', 'ativo', 'desistiu')),
  add column chamado_em timestamptz,
  add column convidado_em timestamptz,
  add column nota text;

-- O aviso no Telegram lê nome e cidade de quem indicou.
grant select (nome, cidade, codigo_indicacao) on public.convites to service_role;

create view public.indicacoes with (security_invoker = true) as
  select quem.nome as indicou, quem.whatsapp as whatsapp_de_quem_indicou,
         chegou.nome as chegou, chegou.whatsapp as whatsapp_de_quem_chegou, chegou.criado_em as chegou_em
  from public.convites chegou
  join public.convites quem on chegou.ref = quem.codigo_indicacao;

-- Pedidos ainda em 'novo' há mais de 3 dias úteis (seg a sex).
create view public.atrasados with (security_invoker = true) as
  select id, criado_em, nome, whatsapp, perfil, cidade
  from public.convites c
  where c.status = 'novo'
    and (select count(*) from generate_series(c.criado_em::date + 1, current_date, interval '1 day') d
         where extract(isodow from d) < 6) > 3
  order by criado_em;

-- Últimos 7 dias por origem e perfil.
create view public.semana_por_origem with (security_invoker = true) as
  select case when ref ~ '^[a-hjkmnp-z2-9]{8}$' then 'indicação'
              when utm_source is not null then utm_source
              else 'direto' end as origem,
         perfil, count(*) as pedidos
  from public.convites
  where criado_em >= now() - interval '7 days'
  group by 1, 2
  order by pedidos desc;

revoke all on public.indicacoes, public.atrasados, public.semana_por_origem from anon, authenticated;

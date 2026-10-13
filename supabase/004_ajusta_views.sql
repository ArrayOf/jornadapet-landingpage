-- Ajustes da revisão final nas views do 003 (NT-004 §8). Pode rodar a qualquer momento:
-- "create or replace" mantém as colunas, os dados e o revoke de anon/authenticated.

-- atrasados: conta os dias úteis pelo horário de Brasília (coluna dia, do 002), não em UTC.
-- Antes, um pedido de sexta às 22h (Brasília) virava sábado em UTC e a contagem errava por um dia.
create or replace view public.atrasados with (security_invoker = true) as
  select id, criado_em, nome, whatsapp, perfil, cidade
  from public.convites c
  where c.status = 'novo'
    and (select count(*)
         from generate_series(c.dia + 1, (now() at time zone 'America/Sao_Paulo')::date, interval '1 day') d
         where extract(isodow from d) < 6) > 3
  order by criado_em;

-- indicacoes: uma linha por par (quem indicou, quem chegou).
-- - quem indicou e reenviou em outro dia (mesmo código) conta uma vez, pelo primeiro pedido;
-- - quem chegou e reenviou em outro dia conta uma vez, pelo primeiro pedido;
-- - quem abre o próprio link e pede de novo (mesmo WhatsApp) não conta como indicação.
create or replace view public.indicacoes with (security_invoker = true) as
  select distinct on (quem.codigo_indicacao, chegou.whatsapp)
         quem.nome        as indicou,
         quem.whatsapp    as whatsapp_de_quem_indicou,
         chegou.nome      as chegou,
         chegou.whatsapp  as whatsapp_de_quem_chegou,
         chegou.criado_em as chegou_em
  from public.convites chegou
  join (select distinct on (codigo_indicacao) codigo_indicacao, nome, whatsapp
        from public.convites
        where codigo_indicacao is not null
        order by codigo_indicacao, criado_em) quem
    on chegou.ref = quem.codigo_indicacao
  where chegou.whatsapp <> quem.whatsapp
  order by quem.codigo_indicacao, chegou.whatsapp, chegou.criado_em;

-- Um pedido por WhatsApp por dia (horário de Brasília). O Worker trata o conflito (409) como sucesso.
-- Se já houver linhas repetidas de teste, apague-as antes (Table Editor) ou o índice não é criado.
alter table public.convites
  add column dia date not null default ((now() at time zone 'America/Sao_Paulo')::date);

create unique index convites_whatsapp_por_dia on public.convites (whatsapp, dia);

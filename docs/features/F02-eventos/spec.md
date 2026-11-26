# F02 Eventos — spec

Evento nasce `draft`. Campos: nome, `starts_at` (interpretado como horário de São Paulo), local, lotação inteira ≥ 1, `price_cents` > 0. Publicar só sai de `draft` e só se o início ainda é futuro. Vitrine e a futura lista da API mostram só `published`.

A página `/organizer/events/:id` é a gestão. A listagem `/organizer/events` filtra `organizer_id`. Outro organizador, participante ou visitante não recebe o nome nem o painel: a autorização ocorre antes do HTML.

Arquivos: `src/events.js`, trechos de organizador em `src/routes.js`, `src/html.js`.

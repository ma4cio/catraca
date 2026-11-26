# F05 API de parceiros — spec

Mesmo processo da vitrine. Rotas sob `/api/partner`. O hook `onRequest` responde 401 `unauthorized` se `X-Api-Key` não é `PARTNER_API_KEY` (padrão `partner_key_catraca_dev`), antes do parser invalidar o corpo.

Ordem depois da chave, na compra: corpo inválido 422 `invalid_request`; evento ausente, rascunho ou cancelado 404 `event_not_available`; sem vaga 409 `sold_out`; senão 202 com o ingresso `pending` criado pela F04.

`GET /events` só publicados, `availableSeats` vindo de `eventMetrics`. `GET /tickets/:id` devolve o DTO, de qualquer canal. Id desconhecido: 404 `ticket_not_found`.

Arquivos: rotas em `src/partner.js`, registradas como plugin do Fastify em `src/app.js`.

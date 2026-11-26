# F05 API de parceiros — contrato

Pré-requisitos: `$API` = http://127.0.0.1:3000 e `$KEY` = partner_key_catraca_dev. Evento publicado conhecido.

| Item | Como verificar | Critérios |
| --- | --- | --- |
| P01 | Nas três rotas, sem cabeçalho e com `X-Api-Key: errada`, o status é 401 e o corpo é `{"error":"unauthorized"}`. | AC-F05-1 |
| P02 | `POST .../purchases` com `{"buyerEmail":"ana@example.com","cardNumber":"123"}` num id inexistente responde 422 `invalid_request`. E-mail "ana" responde 422. Id inexistente com cartão válido responde 404 `event_not_available`. `GET /api/partner/tickets/tkt_missing` responde 404 `ticket_not_found`. | AC-F05-2 |
| P03 | Lista de um publicado traz os cinco campos, `priceCents` numérico e `startsAt` terminando em `-03:00`. Compra válida responde 202 com `ticketId`, `code` e `status: "pending"`. A consulta desse id traz `eventId`, `status` e `checkedIn`. | AC-F05-3 |
| P04 | Rascunho não aparece na lista. `availableSeats` cai quando há `pending` e volta quando a recusa libera. | CF-F05-F02, R02, R05 |
| P05 | Compra da API incrementa o painel do organizador e o código passa no check-in da F06 como um ingresso da vitrine. | CF-F05-F04, R06, R12 |

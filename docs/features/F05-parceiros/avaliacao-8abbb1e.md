# F05 - API de parceiros

Avaliação independente de 26 de novembro de 2026 (UTC) sobre o commit [`8abbb1e8d8f19094ad9262dcbe62380e96dfaadd`](https://github.com/ma4cio/catraca/commit/8abbb1e8d8f19094ad9262dcbe62380e96dfaadd). A avaliação usou Codex, da família GPT-6. A sessão não expôs a variante exata do modelo.

**Resultado aprovado.** 5 de 5 itens do contrato verificados no ambiente real. O job `acceptance` rodou no GitHub Actions com Ubuntu 26.04, Node.js v22.23.5 e os serviços de aplicação e PostgreSQL no Docker Compose. Em checkout limpo, `docker compose up --build -d --wait` iniciou os serviços. O exercício HTTP com `node scripts/evaluator.mjs` passou os 16 passos com o gateway padrão. `bash scripts/gates.sh` registrou 15 testes aprovados, zero falhas e `Gates ok`. O job também confirmou que o produto parou, iniciou novamente e aceitou o login das três contas da seed. [Log da execução](https://github.com/ma4cio/catraca/actions/runs/45743439723/job/139653702937).

| Item | Veredicto | Evidência observada |
| --- | --- | --- |
| P01 | Aprovado | Sem chave e com chave inválida, as três rotas devolveram 401 e `{"error":"unauthorized"}`. Na rota de compra, o teste com JSON malformado confirmou que a autenticação ocorre antes do parser. |
| P02 | Aprovado | Corpo ausente, JSON malformado, campos ausentes, e-mail `ana` e cartão `123` devolveram 422 `invalid_request`. Corpo válido para evento inexistente, em rascunho ou cancelado devolveu 404 `event_not_available`. Evento sem vagas devolveu 409 `sold_out` e ingresso inexistente devolveu 404 `ticket_not_found`. |
| P03 | Aprovado | A lista retornou `id`, `name`, `startsAt`, `priceCents` e `availableSeats`, com preço numérico e data terminada em `-03:00`. A compra devolveu 202, `ticketId`, `code` e `pending`. A consulta trouxe os mesmos `ticketId` e `code`, além dos valores esperados de `eventId`, `status` e `checkedIn`. |
| P04 | Aprovado | O rascunho ficou fora da lista. No evento publicado, a lista mostrou `availableSeats: 0` com o ingresso `pending` e `availableSeats: 1` depois da recusa. |
| P05 | Aprovado | A compra por API elevou a contagem e a receita do painel. Um ingresso comprado por API recebeu `Entrada liberada` no check-in. Após o cancelamento, a consulta da API retornou `refunded` para esse mesmo ingresso. |

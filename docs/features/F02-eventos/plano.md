# F02 Eventos — plano

1. Tabela `events` com status `draft | published | cancelled`.
2. `readEventInput` rejeita data passada, lotação inválida e preço não positivo.
3. `createEvent` grava rascunho. `publishEvent` só promove rascunho.
4. `updateEvent` trava a linha, lê `eventMetrics` e recusa lotação menor que as vagas ocupadas.
5. Vitrine em `GET /` só com publicados.
6. `requireOwnedEvent` devolve 403 ou 404 genérico sem vazar o evento.

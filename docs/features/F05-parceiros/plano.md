# F05 API de parceiros — plano

1. Hook de autenticação da chave.
2. Listagem reusando `listPublishedEvents` e `eventMetrics`.
3. Compra reusando `purchaseTicket` com canal `partner` e sem `buyerUserId`.
4. Consulta reusando `ticketDto`.
5. Testes do contrato: 401 nas três rotas, 422 antes de 404, 409, 404 de ticket, campos do 200 e do 202.

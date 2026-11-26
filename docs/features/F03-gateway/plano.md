# F03 Gateway — plano

1. Implementar `gatewayPlan` lendo o ambiente a cada chamada.
2. Na compra, gravar `gateway_approved`, `card_last4` e `settle_at`.
3. `scheduleSettle` dispara `settleTicket` no prazo. A varredura de `src/worker.js` pega pendentes vencidos, inclusive depois de reinício.
4. `settleTicket` trava o evento e depois o ingresso. Se o ingresso não está `pending`, não muda nada. Se o evento está cancelado, não aplica o plano.

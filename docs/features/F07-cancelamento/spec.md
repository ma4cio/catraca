# F07 Cancelamento e painel — spec

`cancelEvent` trava o evento. Só `published` do organizador dono segue. Na mesma transação o status vai para `cancelled`, confirmados viram `refunded` e pendentes viram `cancelled`. Recusados não mudam. Não há volta para rascunho nem novo publicar.

A página de gestão, cancelada, não renderiza inputs de edição. O painel continua, lido de `eventMetrics`:

- Confirmados: status `confirmed` (inclui quem fez check-in)
- Pendentes: `pending`
- Check-ins: `confirmed` e `checked_in`
- Vagas: lotação menos ocupadas; zero se cancelado
- Receita: soma de `price_cents` dos `confirmed`, formatada `R$ 1.234,56`
- Estornados: quantidade de `refunded`

`settleTicket`, se encontrar o evento cancelado, não grava `confirmed` nem `declined`.

# F06 Check-in — spec

`checkIn(eventId, code)` em `src/checkin.js`. A transação trava o evento e depois o ingresso, e devolve a primeira frase verdadeira:

1. Código vazio, desconhecido ou de outro evento: `Ingresso inválido para este evento`
2. Evento `cancelled`: `Evento cancelado`
3. Status diferente de `confirmed`: `Ingresso não confirmado`
4. `checked_in` já verdadeiro: `Ingresso já utilizado`
5. Caso restante: marca `checked_in` e devolve `Entrada liberada`

O `POST /organizer/events/:id/checkin` mostra a frase em `#checkin-result`. O campo continua disponível mesmo com o evento cancelado, então a lista vale. Código é comparado em maiúsculas.

# F03 Gateway — spec

`gatewayPlan(cardNumber)` em `src/gateway.js`. Sem 16 dígitos, devolve `null`. Caso contrário devolve `{ approved, delayMs }`.

Padrão, sem variáveis de ambiente: rápido 2000–4000 ms (`0001` aprova, `0002` e qualquer outro final recusam); lento 33000–40000 ms (`0003` aprova, `0004` recusa). Os limites ficam dentro das janelas do avaliador: confirmação do `0001` antes de 5 s, `0004` ainda pendente antes de 30 s, liquidado antes de 45 s.

`GATEWAY_FAST_MIN_MS`, `GATEWAY_FAST_MAX_MS`, `GATEWAY_SLOW_MIN_MS` e `GATEWAY_SLOW_MAX_MS` só encolhem o relógio nos testes. O serviço publicado pelo compose não as define.

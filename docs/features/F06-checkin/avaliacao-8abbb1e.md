# F06 - Check-in

Avaliação independente de 26 de novembro de 2026 (UTC) sobre o commit [`8abbb1e8d8f19094ad9262dcbe62380e96dfaadd`](https://github.com/ma4cio/catraca/commit/8abbb1e8d8f19094ad9262dcbe62380e96dfaadd). A avaliação usou Codex, da família GPT-6. A sessão não expôs a variante exata do modelo.

**Resultado aprovado.** 4 de 4 itens do contrato verificados no ambiente real. O job `acceptance` rodou no GitHub Actions com Ubuntu 26.04, Node.js v22.23.5 e os serviços de aplicação e PostgreSQL no Docker Compose. Em checkout limpo, `docker compose up --build -d --wait` iniciou os serviços. O exercício HTTP com `node scripts/evaluator.mjs` passou os 16 passos com o gateway padrão. `bash scripts/gates.sh` registrou 15 testes aprovados, zero falhas e `Gates ok`. O job também confirmou que o produto parou, iniciou novamente e aceitou o login das três contas da seed. [Log da execução](https://github.com/ma4cio/catraca/actions/runs/45743439723/job/139653702937).

| Item | Veredicto | Evidência observada |
| --- | --- | --- |
| K01 | Aprovado | O campo `#checkin-result` devolveu `Entrada liberada` no primeiro uso de um código confirmado e `Ingresso já utilizado` no segundo. |
| K02 | Aprovado | Ingresso recusado devolveu `Ingresso não confirmado`. `ZZZZZZZZ` e o código de outro evento devolveram `Ingresso inválido para este evento`. |
| K03 | Aprovado | Após a primeira entrada, o painel exibiu `Check-ins` igual a 1. |
| K04 | Aprovado | Após cancelar o evento, o código anteriormente confirmado devolveu `Evento cancelado`. |

# F04 - Compras e vagas

Avaliação independente de 26 de novembro de 2026 (UTC) sobre o commit [`8abbb1e8d8f19094ad9262dcbe62380e96dfaadd`](https://github.com/ma4cio/catraca/commit/8abbb1e8d8f19094ad9262dcbe62380e96dfaadd). A avaliação usou Codex, da família GPT-6. A sessão não expôs a variante exata do modelo.

**Resultado aprovado.** 5 de 5 itens do contrato verificados no ambiente real. O job `acceptance` rodou no GitHub Actions com Ubuntu 26.04, Node.js v22.23.5 e os serviços de aplicação e PostgreSQL no Docker Compose. Em checkout limpo, `docker compose up --build -d --wait` iniciou os serviços. O exercício HTTP com `node scripts/evaluator.mjs` passou os 16 passos com o gateway padrão. `bash scripts/gates.sh` registrou 15 testes aprovados, zero falhas e `Gates ok`. O job também confirmou que o produto parou, iniciou novamente e aceitou o login das três contas da seed. [Log da execução](https://github.com/ma4cio/catraca/actions/runs/45743439723/job/139653702937).

| Item | Veredicto | Evidência observada |
| --- | --- | --- |
| C01 | Aprovado | A compra na vitrine com `4000000000000001` respondeu 303. `Meus ingressos` exibiu o evento, `pendente` e um código de oito caracteres. A página exibiu `confirmado` em até 5 segundos no modo padrão. |
| C02 | Aprovado | Com uma vaga, o ingresso `0004` ficou pendente e a vitrine indicou `Ingressos esgotados`. A segunda tentativa retornou 409 `sold_out` e o Postgres permaneceu com um ingresso. Após a recusa, uma nova compra retornou 202 e confirmou. |
| C03 | Aprovado | No HTTP, em cada um de dois eventos de cinco vagas, 30 compras simultâneas produziram cinco 202 e 25 retornos 409. Os gates repetiram a carga em três eventos e o `SELECT count(*)` retornou cinco ingressos em cada um. |
| C04 | Aprovado | A participante compradora viu seu ingresso em `Meus ingressos`. Com a sessão de outra participante, a mesma página respondeu 200 sem o evento nem o código. |
| C05 | Aprovado | A tentativa de compra em rascunho devolveu 404 na vitrine e 404 `event_not_available` na API. A consulta ao Postgres retornou zero ingressos para o rascunho. |

# F01 - Identidade

Avaliação independente de 26 de novembro de 2026 (UTC) sobre o commit [`8abbb1e8d8f19094ad9262dcbe62380e96dfaadd`](https://github.com/ma4cio/catraca/commit/8abbb1e8d8f19094ad9262dcbe62380e96dfaadd). A avaliação usou Codex, da família GPT-6. A sessão não expôs a variante exata do modelo.

**Resultado aprovado.** 4 de 4 itens do contrato verificados no ambiente real. O job `acceptance` rodou no GitHub Actions com Ubuntu 26.04, Node.js v22.23.5 e os serviços de aplicação e PostgreSQL no Docker Compose. Em checkout limpo, `docker compose up --build -d --wait` iniciou os serviços. O exercício HTTP com `node scripts/evaluator.mjs` passou os 16 passos com o gateway padrão. `bash scripts/gates.sh` registrou 15 testes aprovados, zero falhas e `Gates ok`. O job também confirmou que o produto parou, iniciou novamente e aceitou o login das três contas da seed. [Log da execução](https://github.com/ma4cio/catraca/actions/runs/45743439723/job/139653702937).

| Item | Veredicto | Evidência observada |
| --- | --- | --- |
| I01 | Aprovado | O login da organizadora da seed respondeu 303 com `Set-Cookie`. A sessão retornou 200 em `GET /organizer/events`. |
| I02 | Aprovado | O cadastro respondeu 303 mesmo com `role=organizer` enviado pelo formulário. O banco registrou `participant`. O login da nova conta funcionou e a lista do organizador respondeu 403 sem o nome do evento de A. |
| I03 | Aprovado | `POST /logout` respondeu 303. O `GET` da gestão respondeu 403 e ocultou os dados do evento tanto sem cookie quanto com o cookie invalidado. |
| I04 | Aprovado | O `POST` anônimo respondeu 403, sem gravar o evento no Postgres. O nome enviado não apareceu na vitrine nem na lista da API. |

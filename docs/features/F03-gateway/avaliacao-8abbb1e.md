# F03 - Gateway

Avaliação independente de 26 de novembro de 2026 (UTC) sobre o commit [`8abbb1e8d8f19094ad9262dcbe62380e96dfaadd`](https://github.com/ma4cio/catraca/commit/8abbb1e8d8f19094ad9262dcbe62380e96dfaadd). A avaliação usou Codex, da família GPT-6. A sessão não expôs a variante exata do modelo.

**Resultado aprovado.** 3 de 3 itens do contrato verificados no ambiente real. O job `acceptance` rodou no GitHub Actions com Ubuntu 26.04, Node.js v22.23.5 e os serviços de aplicação e PostgreSQL no Docker Compose. Em checkout limpo, `docker compose up --build -d --wait` iniciou os serviços. O exercício HTTP com `node scripts/evaluator.mjs` passou os 16 passos com o gateway padrão. `bash scripts/gates.sh` registrou 15 testes aprovados, zero falhas e `Gates ok`. O job também confirmou que o produto parou, iniciou novamente e aceitou o login das três contas da seed. [Log da execução](https://github.com/ma4cio/catraca/actions/runs/45743439723/job/139653702937).

| Item | Veredicto | Evidência observada |
| --- | --- | --- |
| G01 | Aprovado | O cartão `123` respondeu 422 na vitrine e 422 `invalid_request` na API. O Postgres registrou zero ingressos para o evento após as tentativas. |
| G02 | Aprovado | Com gateway padrão, o `0001` retornou `pending` e confirmou em até 5 segundos. Nos gates com atrasos documentados, o `0002` resultou em `declined` e a vaga voltou, totalizando duas vagas livres de três. |
| G03 | Aprovado | Com gateway padrão, o `0004` ainda estava `pending` antes de 30 segundos, ocupava a vaga e impedia outra compra. Após 45 segundos apareceu `declined` e a vaga foi restaurada. |

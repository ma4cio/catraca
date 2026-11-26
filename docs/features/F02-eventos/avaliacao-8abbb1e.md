# F02 - Eventos

Avaliação independente de 26 de novembro de 2026 (UTC) sobre o commit [`8abbb1e8d8f19094ad9262dcbe62380e96dfaadd`](https://github.com/ma4cio/catraca/commit/8abbb1e8d8f19094ad9262dcbe62380e96dfaadd). A avaliação usou Codex, da família GPT-6. A sessão não expôs a variante exata do modelo.

**Resultado aprovado.** 5 de 5 itens do contrato verificados no ambiente real. O job `acceptance` rodou no GitHub Actions com Ubuntu 26.04, Node.js v22.23.5 e os serviços de aplicação e PostgreSQL no Docker Compose. Em checkout limpo, `docker compose up --build -d --wait` iniciou os serviços. O exercício HTTP com `node scripts/evaluator.mjs` passou os 16 passos com o gateway padrão. `bash scripts/gates.sh` registrou 15 testes aprovados, zero falhas e `Gates ok`. O job também confirmou que o produto parou, iniciou novamente e aceitou o login das três contas da seed. [Log da execução](https://github.com/ma4cio/catraca/actions/runs/45743439723/job/139653702937).

| Item | Veredicto | Evidência observada |
| --- | --- | --- |
| E01 | Aprovado | O rascunho ficou fora da vitrine e da API. Depois de publicar, ambas o listaram, e a API devolveu `priceCents: 10000` e `availableSeats: 2`. |
| E02 | Aprovado | A criação e a edição com data passada responderam 422 e indicaram que a data deve estar no futuro. A lista do organizador não incluiu o evento rejeitado. |
| E03 | Aprovado | A gestão respondeu na URL `/organizer/events/{id}` com o nome do evento. Capacidade zero e preço zero responderam 422 e gravaram zero eventos no Postgres. |
| E04 | Aprovado | Com dois ingressos confirmados, reduzir a lotação de 2 para 1 respondeu 422 e manteve 2. Aumentar para 3 e editar o preço respondeu 303. O painel apurou R$ 350,00 após a terceira compra (R$ 100,00 + R$ 100,00 + R$ 150,00). |
| E05 | Aprovado | A lista de B omitiu o evento de A. O acesso direto de B respondeu 404 sem o nome nem `Confirmados`. A participante da seed e o visitante receberam 403 sem o nome. |

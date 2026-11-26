# F07 - Cancelamento e painel

Avaliação independente de 26 de novembro de 2026 (UTC) sobre o commit [`8abbb1e8d8f19094ad9262dcbe62380e96dfaadd`](https://github.com/ma4cio/catraca/commit/8abbb1e8d8f19094ad9262dcbe62380e96dfaadd). A avaliação usou Codex, da família GPT-6. A sessão não expôs a variante exata do modelo.

**Resultado aprovado.** 4 de 4 itens do contrato verificados no ambiente real. O job `acceptance` rodou no GitHub Actions com Ubuntu 26.04, Node.js v22.23.5 e os serviços de aplicação e PostgreSQL no Docker Compose. Em checkout limpo, `docker compose up --build -d --wait` iniciou os serviços. O exercício HTTP com `node scripts/evaluator.mjs` passou os 16 passos com o gateway padrão. `bash scripts/gates.sh` registrou 15 testes aprovados, zero falhas e `Gates ok`. O job também confirmou que o produto parou, iniciou novamente e aceitou o login das três contas da seed. [Log da execução](https://github.com/ma4cio/catraca/actions/runs/45743439723/job/139653702937).

| Item | Veredicto | Evidência observada |
| --- | --- | --- |
| X01 | Aprovado | Após confirmar uma compra a R$ 100,00, a lotação foi aumentada e o preço passou a R$ 150,00. A segunda compra elevou a receita a R$ 250,00. No fluxo de dois ingressos a R$ 100,00 e um a R$ 150,00, o painel exibiu R$ 350,00, 3 confirmados e zero pendentes, check-ins, vagas e estornados. |
| X02 | Aprovado | O gateway padrão manteve o `0003` pendente até o cancelamento. Em até 10 segundos, `0001` ficou `refunded` e `0003` ficou `cancelled`. Vitrine e API ocultaram o evento. Nova compra devolveu 404 `event_not_available`. A gestão não exibiu `name="capacity"`. |
| X03 | Aprovado | Ao fim da janela do gateway padrão, o `0003` permanecia `cancelled` e o `0001`, `refunded`. |
| X04 | Aprovado | O check-in antes de cancelar devolveu `Entrada liberada` e contou 1. Depois, painel com zero confirmados, pendentes, check-ins, vagas e receita, além de 1 estornado. A API preservou `checkedIn: true` no estornado. Repetir o check-in devolveu `Evento cancelado`. |

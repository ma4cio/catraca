# F05 — API de parceiros

Data UTC: 2026-11-26. Commit avaliado: `5958df49edd2a637dcd4e8440751835d6c74e746`.

Ferramenta: Codex. A identidade exata do modelo não foi exposta à sessão de avaliação. Ambiente: Windows, Node.js v24.22.3. Avaliação independente sobre uma cópia isolada gerada com `git archive`. O arquivo não rastreado na árvore de trabalho foi excluído.

**Resultado do gate: bloqueado pelo ambiente.** `docker compose config --quiet` e a análise de sintaxe de 25 módulos passaram. `docker version` retornou acesso negado ao pipe `dockerDesktopLinuxEngine`. A tentativa local da suíte com `node --test --test-concurrency=1` parou na importação de `fastify` (`ERR_MODULE_NOT_FOUND`). O arquivo de configuração de ambiente carregou; nenhum cenário da suíte executou. Os resultados parciais abaixo vêm de código real executado diretamente pelo avaliador, com banco simulado onde indicado. A revisão estática indica a cobertura candidata. Nenhum item foi aprovado de ponta a ponta ou reprovado com base em execução de produto.

| Item | Veredicto | Evidência observada |
| --- | --- | --- |
| P01 | Bloqueado — parcial verificado | O hook `onRequest` das três rotas devolveu 401 e `{"error":"unauthorized"}` com chave ausente e incorreta. A execução usou captura de handlers, sem o pipeline do Fastify. |
| P02 | Bloqueado — parcial verificado | Com id inexistente, as chamadas diretas com corpo ausente, `{}`, e-mail `ana` ou cartão `123` retornaram 422 `invalid_request`. O callback de erro do parser recebeu 400 simulado e retornou 422. A interpretação de JSON malformado pelo Fastify e os retornos 404/409 ligados ao banco ficaram pendentes. |
| P03 | Bloqueado — parcial verificado | O handler de listagem com persistência simulada retornou os cinco campos, `priceCents` numérico e `startsAt` finalizado em `-03:00`. Compra 202 e consulta do ingresso ainda dependem da execução com banco. |
| P04 | Bloqueado — revisão estática | Listagem consulta apenas publicados e usa `eventMetrics`. A contagem considera `pending` e `confirmed`; liquidação recusada grava `declined`. A sequência de valores de `availableSeats` ficou pendente. |
| P05 | Bloqueado — revisão estática | A API usa o mesmo `purchaseTicket`; métricas e check-in consultam a tabela comum `tickets`, e o cancelamento estorna os confirmados. O fluxo completo com painel, check-in e API ficou pendente. |
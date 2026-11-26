# F07 — Cancelamento e painel

Data UTC: 2026-11-26. Commit avaliado: `5958df49edd2a637dcd4e8440751835d6c74e746`.

Ferramenta: Codex. A identidade exata do modelo não foi exposta à sessão de avaliação. Ambiente: Windows, Node.js v24.22.3. Avaliação independente sobre uma cópia isolada gerada com `git archive`. O arquivo não rastreado na árvore de trabalho foi excluído.

**Resultado do gate: bloqueado pelo ambiente.** `docker compose config --quiet` e a análise de sintaxe de 25 módulos passaram. `docker version` retornou acesso negado ao pipe `dockerDesktopLinuxEngine`. A tentativa local da suíte com `node --test --test-concurrency=1` parou na importação de `fastify` (`ERR_MODULE_NOT_FOUND`). O arquivo de configuração de ambiente carregou; nenhum cenário da suíte executou. Os resultados parciais abaixo vêm de código real executado diretamente pelo avaliador, com banco simulado onde indicado. A revisão estática indica a cobertura candidata. Nenhum item foi aprovado de ponta a ponta ou reprovado com base em execução de produto.

| Item | Veredicto | Evidência observada |
| --- | --- | --- |
| X01 | Bloqueado — parcial verificado | O formatador executado exibiu `R$ 250,00` e `R$ 350,00`. O SQL soma `tickets.price_cents` dos confirmados e a compra grava o preço vigente. Compras, edição e agregação reais nos dois cenários ficaram pendentes. |
| X02 | Bloqueado — parcial verificado | O renderizador com evento `cancelled` omitiu `name="capacity"`. `cancelEvent` usa uma transação para atualizar evento e ingressos. Os retornos da vitrine/API, o limite de 10 s e os estados persistidos ficaram pendentes. |
| X03 | Bloqueado — revisão estática | `settleTicket` descarta estado não pendente e verifica novamente com as linhas travadas. O teste versionado espera a janela lenta e reconfirma `cancelled` e `refunded`, sem execução. |
| X04 | Bloqueado — parcial verificado | Com dados simulados, o check-in mudou de `Entrada liberada` para `Evento cancelado` e preservou `checked_in`; o painel renderizado exibiu 1 check-in antes e 1 estornado depois. As métricas pós-cancelamento, o DTO real e a persistência ficaram pendentes. |
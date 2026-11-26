# F06 — Check-in

Data UTC: 2026-11-26. Commit avaliado: `5958df49edd2a637dcd4e8440751835d6c74e746`.

Ferramenta: Codex. A identidade exata do modelo não foi exposta à sessão de avaliação. Ambiente: Windows, Node.js v24.22.3. Avaliação independente sobre uma cópia isolada gerada com `git archive`. O arquivo não rastreado na árvore de trabalho foi excluído.

**Resultado do gate: bloqueado pelo ambiente.** `docker compose config --quiet` e a análise de sintaxe de 25 módulos passaram. `docker version` retornou acesso negado ao pipe `dockerDesktopLinuxEngine`. A tentativa local da suíte com `node --test --test-concurrency=1` parou na importação de `fastify` (`ERR_MODULE_NOT_FOUND`). O arquivo de configuração de ambiente carregou; nenhum cenário da suíte executou. Os resultados parciais abaixo vêm de código real executado diretamente pelo avaliador, com banco simulado onde indicado. A revisão estática indica a cobertura candidata. Nenhum item foi aprovado de ponta a ponta ou reprovado com base em execução de produto.

| Item | Veredicto | Evidência observada |
| --- | --- | --- |
| K01 | Bloqueado — parcial verificado | A função real com persistência simulada respondeu `Entrada liberada` e `Ingresso já utilizado` em sequência. O renderizador incluiu `#checkin-result` com a primeira mensagem. O formulário, o endpoint HTTP e o banco reais ficaram pendentes. |
| K02 | Bloqueado — parcial verificado | A função com persistência simulada devolveu as mensagens corretas para ingresso recusado e código `ZZZZZZZZ`. O SQL filtra `event_id` e `code`. O cenário com código confirmado de outro evento existente ficou pendente. |
| K03 | Bloqueado — parcial verificado | A primeira leitura atualizou `checked_in` no banco simulado. O renderizador exibiu `m-checkins` com 1 para esse valor; a agregação real no banco ficou pendente. |
| K04 | Bloqueado — parcial verificado | Com evento cancelado e ingresso antes confirmado, agora estornado no cenário simulado, a função devolveu `Evento cancelado`. A transação de cancelamento e o POST reais ficaram pendentes. |
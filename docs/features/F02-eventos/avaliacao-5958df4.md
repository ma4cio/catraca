# F02 — Eventos

Data UTC: 2026-11-26. Commit avaliado: `5958df49edd2a637dcd4e8440751835d6c74e746`.

Ferramenta: Codex. A identidade exata do modelo não foi exposta à sessão de avaliação. Ambiente: Windows, Node.js v24.22.3. Avaliação independente sobre uma cópia isolada gerada com `git archive`. O arquivo não rastreado na árvore de trabalho foi excluído.

**Resultado do gate: bloqueado pelo ambiente.** `docker compose config --quiet` e a análise de sintaxe de 25 módulos passaram. `docker version` retornou acesso negado ao pipe `dockerDesktopLinuxEngine`. A tentativa local da suíte com `node --test --test-concurrency=1` parou na importação de `fastify` (`ERR_MODULE_NOT_FOUND`). O arquivo de configuração de ambiente carregou; nenhum cenário da suíte executou. Os resultados parciais abaixo vêm de código real executado diretamente pelo avaliador, com banco simulado onde indicado. A revisão estática indica a cobertura candidata. Nenhum item foi aprovado de ponta a ponta ou reprovado com base em execução de produto.

| Item | Veredicto | Evidência observada |
| --- | --- | --- |
| E01 | Bloqueado — revisão estática | `createEvent` grava `draft`, `publishEvent` transita para `published` e `listPublishedEvents` filtra esse estado. O teste versionado verifica ausência e presença na vitrine/API, preço inteiro e lotação. Não executou. |
| E02 | Bloqueado — parcial verificado | O parser executado com uma data passada devolveu `past_date`. A criação e edição usam esse parser e o texto de erro menciona futuro. Respostas HTTP 422 e ausência no banco ficaram pendentes. |
| E03 | Bloqueado — parcial verificado | O parser executado rejeitou lotação zero e preço zero. A rota de gestão renderiza o evento após verificar seu dono. A navegação e a persistência reais ficaram pendentes. |
| E04 | Bloqueado — revisão estática | A edição trava a linha de evento e compara a nova lotação com `metrics.occupied`. O `UPDATE` toca somente `events`; a compra copia `event.price_cents` no ingresso. O cenário de rejeição, aumento e receita histórica existe no teste, sem execução. |
| E05 | Bloqueado — revisão estática | A lista filtra `organizer_id`. A guarda retorna 403 para visitante e participante, antes de ler o evento, e 404 sem dados para outro organizador. O cenário completo está no teste de aceitação, sem execução. |
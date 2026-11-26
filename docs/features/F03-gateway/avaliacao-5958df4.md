# F03 — Gateway

Data UTC: 2026-11-26. Commit avaliado: `5958df49edd2a637dcd4e8440751835d6c74e746`.

Ferramenta: Codex. A identidade exata do modelo não foi exposta à sessão de avaliação. Ambiente: Windows, Node.js v24.22.3. Avaliação independente sobre uma cópia isolada gerada com `git archive`. O arquivo não rastreado na árvore de trabalho foi excluído.

**Resultado do gate: bloqueado pelo ambiente.** `docker compose config --quiet` e a análise de sintaxe de 25 módulos passaram. `docker version` retornou acesso negado ao pipe `dockerDesktopLinuxEngine`. A tentativa local da suíte com `node --test --test-concurrency=1` parou na importação de `fastify` (`ERR_MODULE_NOT_FOUND`). O arquivo de configuração de ambiente carregou; nenhum cenário da suíte executou. Os resultados parciais abaixo vêm de código real executado diretamente pelo avaliador, com banco simulado onde indicado. A revisão estática indica a cobertura candidata. Nenhum item foi aprovado de ponta a ponta ou reprovado com base em execução de produto.

| Item | Veredicto | Evidência observada |
| --- | --- | --- |
| G01 | Bloqueado — parcial verificado | O plano do gateway recusou `123` e o handler da API retornou 422 `invalid_request` com esse cartão. A vitrine valida o cartão antes da compra. Contagem real de linhas em `tickets` ficou pendente. |
| G02 | Bloqueado — parcial verificado | Em 100 amostras por cartão, `0001` sempre aprovou e `0002` sempre recusou, ambos na janela nominal de 2–4 s. A liquidação real, o limite de 5 s e a devolução da vaga ficaram pendentes. |
| G03 | Bloqueado — parcial verificado | Em 100 amostras, `0004` sempre recusou, com atraso configurado de 33–40 s. A permanência em `pending` antes de 30 s, a vaga ocupada e a transição persistida após a janela ficaram pendentes. |
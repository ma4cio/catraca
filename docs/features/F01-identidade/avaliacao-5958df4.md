# F01 — Identidade

Data UTC: 2026-11-26. Commit avaliado: `5958df49edd2a637dcd4e8440751835d6c74e746`.

Ferramenta: Codex. A identidade exata do modelo não foi exposta à sessão de avaliação. Ambiente: Windows, Node.js v24.22.3. Avaliação independente sobre uma cópia isolada gerada com `git archive`. O arquivo não rastreado na árvore de trabalho foi excluído.

**Resultado do gate: bloqueado pelo ambiente.** `docker compose config --quiet` e a análise de sintaxe de 25 módulos passaram. `docker version` retornou acesso negado ao pipe `dockerDesktopLinuxEngine`. A tentativa local da suíte com `node --test --test-concurrency=1` parou na importação de `fastify` (`ERR_MODULE_NOT_FOUND`). O arquivo de configuração de ambiente carregou; nenhum cenário da suíte executou. Os resultados parciais abaixo vêm de código real executado diretamente pelo avaliador, com banco simulado onde indicado. A revisão estática indica a cobertura candidata. Nenhum item foi aprovado de ponta a ponta ou reprovado com base em execução de produto.

| Item | Veredicto | Evidência observada |
| --- | --- | --- |
| I01 | Bloqueado — parcial verificado | Com as credenciais da seed e persistência simulada, os handlers retornaram 303, solicitaram o cookie `sid` e retornaram 200 na lista com a sessão. O cabeçalho HTTP real e a seed no Postgres ficaram pendentes. |
| I02 | Bloqueado — parcial verificado | O handler de cadastro retornou 303. A consulta com a sessão produzida respondeu 403 sem o nome do evento. `registerParticipant` fixa o papel no `INSERT`; a gravação real ficou pendente. |
| I03 | Bloqueado — parcial verificado | Com sessões simuladas, logout solicitou a remoção do cookie, invalidou a sessão e a gestão respondeu 403 tanto sem cookie quanto com o cookie antigo. O retorno sem dados do evento decorre da guarda antes da leitura do evento. |
| I04 | Bloqueado — parcial verificado | A chamada anônima retornou 403, registrou zero chamadas de inserção e o nome não apareceu nos handlers da vitrine e da API com consultas simuladas. Consulta real ao banco e HTTP ficaram pendentes. |
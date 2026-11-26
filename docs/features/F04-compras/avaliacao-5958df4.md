# F04 — Compras e vagas

Data UTC: 2026-11-26. Commit avaliado: `5958df49edd2a637dcd4e8440751835d6c74e746`.

Ferramenta: Codex. A identidade exata do modelo não foi exposta à sessão de avaliação. Ambiente: Windows, Node.js v24.22.3. Avaliação independente sobre uma cópia isolada gerada com `git archive`. O arquivo não rastreado na árvore de trabalho foi excluído.

**Resultado do gate: bloqueado pelo ambiente.** `docker compose config --quiet` e a análise de sintaxe de 25 módulos passaram. `docker version` retornou acesso negado ao pipe `dockerDesktopLinuxEngine`. A tentativa local da suíte com `node --test --test-concurrency=1` parou na importação de `fastify` (`ERR_MODULE_NOT_FOUND`). O arquivo de configuração de ambiente carregou; nenhum cenário da suíte executou. Os resultados parciais abaixo vêm de código real executado diretamente pelo avaliador, com banco simulado onde indicado. A revisão estática indica a cobertura candidata. Nenhum item foi aprovado de ponta a ponta ou reprovado com base em execução de produto.

| Item | Veredicto | Evidência observada |
| --- | --- | --- |
| C01 | Bloqueado — parcial verificado | A renderização de `ticketsPage` com dados de teste mostrou o nome, os rótulos `pendente` e `confirmado` e um código gerado com oito caracteres. A compra pela vitrine e a mudança real de estado ficaram pendentes. |
| C02 | Bloqueado — parcial verificado | `eventPage` mostrou `Ingressos esgotados` com zero vagas. `purchaseTicket` verifica ocupação na transação e a API mapeia `sold_out` para 409. A recusa real, a quantidade de registros e a nova compra ficaram pendentes. |
| C03 | Bloqueado — revisão estática | `purchaseTicket` usa `FOR UPDATE` sobre o evento e conta vagas antes do `INSERT` na mesma transação. O teste prevê 30 compras simultâneas em três eventos e afirma 5 respostas 202, 25 respostas 409 e 5 linhas por evento. O teste não executou. |
| C04 | Bloqueado — revisão estática | `/me/tickets` encaminha `user.id` e a consulta filtra por `buyer_user_id`. O cenário real com duas sessões ficou pendente. |
| C05 | Bloqueado — revisão estática | A vitrine verifica o estado `published`; a compra verifica novamente após travar a linha do evento. A contagem real em um rascunho ficou pendente. |
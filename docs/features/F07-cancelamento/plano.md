# F07 Cancelamento e painel — plano

1. `cancelEvent` na transação única descrita na spec.
2. Painel na gestão, com os ids `m-confirmados`, `m-pendentes`, `m-checkins`, `m-vagas`, `m-receita`, `m-estornados`.
3. `POST .../cancel` só para o dono.
4. Teste: um lento `0003` ainda pending e um rápido já confirmed; cancelar; conferir status, vitrine, API, edição bloqueada, painel e a frase de check-in; esperar a janela lenta e reler os status.

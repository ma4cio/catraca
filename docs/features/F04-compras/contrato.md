# F04 Compras e vagas — contrato

Pré-requisitos: evento publicado pela F02, participante da F01, gateway da F03.

| Item | Como verificar | Critérios |
| --- | --- | --- |
| C01 | Participante compra na vitrine com `4000000000000001`. "Meus ingressos" mostra o evento, "pendente" e um código de 8 caracteres. Na janela rápida, o rótulo passa a "confirmado". | AC-F04-1, R06, R08, R09 |
| C02 | Evento de lotação 1. Compra com final `0004` responde pending e a página do evento mostra "Ingressos esgotados". Outra compra responde sem criar ingresso (API: 409 `sold_out`). Depois da recusa, uma compra nova é aceita. | AC-F04-2, R05, R07, R08 |
| C03 | Dois eventos novos, lotação 5. Em cada um, 30 compras simultâneas pela API com final `0001`. A saída tem 5 respostas 202 e 25 respostas 409. `SELECT count(*) FROM tickets WHERE event_id = …` devolve 5. | AC-F04-3, R07 |
| C04 | O ingresso da vitrine não aparece em "Meus ingressos" de outra conta. | CF-F04-F01 |
| C05 | `POST` de compra num rascunho não cria ingresso. | CF-F04-F02, R02 |

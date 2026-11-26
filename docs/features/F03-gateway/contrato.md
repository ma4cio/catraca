# F03 Gateway — contrato

Pré-requisitos: produto no modo padrão (sem `GATEWAY_*`), ou a suíte com os atrasos curtos documentados no `scripts/gates.sh`. Cartões de teste do brief.

| Item | Como verificar | Critérios |
| --- | --- | --- |
| G01 | `POST` de compra, vitrine ou API, com `cardNumber` "123" não cria linha em `tickets`. A API responde 422 `invalid_request`. | AC-F03-1, R06 |
| G02 | Compra com final `0001`. A resposta já traz `pending`. Dentro de 5 s (modo padrão) o ingresso está `confirmed`. Final `0002` fica `declined` e a vaga volta. | AC-F03-2, CF-F03-F04, R08 |
| G03 | Final `0004`: antes de 30 s o status segue `pending` e a vaga continua ocupada. Depois de 45 s está `declined`. | AC-F03-2 |

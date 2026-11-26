# F06 Check-in — contrato

Pré-requisitos: organizador dono do evento, página `/organizer/events/{id}`.

| Item | Como verificar | Critérios |
| --- | --- | --- |
| K01 | Informar o código de um confirmado. O corpo contém `#checkin-result` com "Entrada liberada". Repetir o mesmo código: "Ingresso já utilizado". | AC-F06-1, AC-F06-2, R10 |
| K02 | Código de ingresso recusado: "Ingresso não confirmado". `ZZZZZZZZ`: "Ingresso inválido para este evento". Código de outro evento: a mesma frase de inválido. | AC-F06-1, CF-F06-F04 |
| K03 | Depois da primeira entrada, o painel mostra Check-ins 1. | AC-F06-2, R12 |
| K04 | Com o evento cancelado, o código que estava confirmado responde "Evento cancelado". | CF-F06-F02, R10 |

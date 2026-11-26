# F07 Cancelamento e painel — contrato

Pré-requisitos: evento publicado do organizador A, com pelo menos um ingresso.

| Item | Como verificar | Critérios |
| --- | --- | --- |
| X01 | Comprar com `4000000000000001` a R$ 100, esperar confirmar, mudar o preço para R$ 150 e a lotação para cima, comprar de novo e esperar. O painel mostra a receita R$ 250,00 para esses dois, não o preço novo nos dois. No cenário do fluxo (dois a R$ 100 e um a R$ 150) a receita é R$ 350,00, confirmados 3, pendentes 0, check-ins 0, vagas 0, estornados 0. | AC-F07-3, CF-F07-F04, R03, R12 |
| X02 | Com um `0003` ainda pending e um `0001` já confirmed, cancelar. Em até 10 s o rápido está `refunded` e o lento `cancelled`. A vitrine e a lista da API não mostram o evento. Nova compra responde 404 `event_not_available`. A gestão não tem `name="capacity"`. | AC-F07-1, AC-F07-2, CF-F07-F02, R11 |
| X03 | Depois da janela lenta, o ingresso do `0003` continua `cancelled` e o do `0001` continua `refunded`. | AC-F07-2, CF-F07-F03 |
| X04 | Antes de cancelar no cenário X02, fazer o check-in do ingresso confirmado: "Entrada liberada" e Check-ins 1. Após cancelar, o painel mostra confirmados 0, pendentes 0, check-ins 0, vagas 0, receita R$ 0,00 e estornados 1. O ingresso estornado mantém `checkedIn: true` na API. Repetir o check-in do código estornado responde "Evento cancelado". | AC-F07-3, CF-F07-F06, R12 |

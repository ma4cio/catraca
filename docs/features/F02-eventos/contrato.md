# F02 Eventos — contrato

Pré-requisitos: ambiente no ar com a seed. Datas de teste com pelo menos um dia no futuro, no formato `YYYY-MM-DDTHH:mm`.

| Item | Como verificar | Critérios |
| --- | --- | --- |
| E01 | Como A, criar evento sem publicar. `GET /` não contém o nome. `GET /api/partner/events` com a chave também não. Publicar. Os dois passam a mostrar o evento, com `priceCents` igual ao preço em centavos e `availableSeats` igual à lotação. | AC-F02-1, R02 |
| E02 | Criar com a data de ontem responde 422 e o texto fala em futuro. O evento não entra na lista do organizador. Editar um publicado para ontem também responde 422. | AC-F02-2, R01 |
| E03 | A gestão abre em `/organizer/events/{id}` e mostra o nome. Lotação 0 ou preço 0 não salvam. | AC-F02-3, R01, R04 |
| E04 | Com dois ingressos confirmados, `POST` de lotação 1 responde 422 e a lotação continua 2. Lotação 3 com preço novo responde 303. Ingressos antigos mantêm o preço da compra (conferido no painel da F07). | CF-F02-F04, R03 |
| E05 | Como B, a lista não contém o evento de A. `GET` da URL de gestão responde 404 sem o nome e sem "Confirmados". Participante da seed e visitante recebem 403 sem o nome. | AC-F02-4, R13 |

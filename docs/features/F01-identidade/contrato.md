# F01 Identidade — contrato

Pré-requisitos: `docker compose up --build -d --wait` concluído, ou o app de teste com a seed. Contas do README.

| Item | Como verificar | Critérios |
| --- | --- | --- |
| I01 | `POST /login` com ana.organizadora@catraca.local / senha-organizador-a responde 303 e `Set-Cookie` de sessão. `GET /organizer/events` com o cookie responde 200. | AC-F01-2 |
| I02 | `POST /register` com nome, e-mail novo e senha responde 303. O usuário criado tem papel de participante: `GET /organizer/events` com essa sessão responde 403 e o corpo não lista eventos de terceiros. | AC-F01-1 |
| I03 | `POST /logout` e, sem cookie, `GET /organizer/events/QUALQUER` responde 403 sem dados de evento. | AC-F01-1, AC-F02-4 |
| I04 | Sem cookie, `POST /organizer/events` responde 403 e o nome enviado não aparece em `GET /` nem na lista da API. | CF-F01-F02 |

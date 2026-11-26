# F01 Identidade — plano

1. Tabela `users` e `sessions` em `db/schema.sql`.
2. `hashPassword` / `verifyPassword` em `src/crypto.js`.
3. `registerParticipant`, `authenticate`, `openSession`, `closeSession`, `currentUser` em `src/users.js`.
4. Rotas `/register`, `/login`, `/logout`.
5. `seed()` idempotente com os dois organizadores e a Paula.
6. Teste: login da seed, cadastro de participante, 403 de participante na área do organizador.

# F01 Identidade — spec

Sessão opaca em cookie `sid` (httpOnly, SameSite=lax), linha em `sessions`. Senha com scrypt (`salt:hash`). Cadastro em `POST /register` grava sempre `participant`. Login em `POST /login` aceita participante e organizador da seed. Logout apaga a sessão.

E-mail é guardado em minúsculas. E-mail repetido devolve erro e não cria outra conta. Organizador não tem caminho de cadastro.

Arquivos: `src/users.js`, `src/crypto.js`, `src/seed.js`, rotas de auth em `src/routes.js`.

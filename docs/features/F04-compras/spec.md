# F04 Compras e vagas — spec

Uma compra, um ingresso. Canais `storefront` e `partner` chamam `purchaseTicket` em `src/purchases.js`.

A transação faz `SELECT … FOR UPDATE` na linha do evento, lê `eventMetrics` na mesma conexão e só então insere `pending` com o `price_cents` atual. Se `occupied >= capacity`, a transação termina sem insert e devolve `sold_out`.

Código de 8 caracteres do alfabeto sem ambíguos, único. "Meus ingressos" lista evento, rótulo em português e código dos ingressos cujo `buyer_user_id` é o participante. Compra de parceiro deixa `buyer_user_id` nulo.

Vitrine: com `available <= 0`, o texto exato é "Ingressos esgotados", no lugar do formulário e também na resposta a um POST tardio.

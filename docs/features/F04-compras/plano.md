# F04 Compras e vagas — plano

1. Tabela `tickets` com status, preço, canal, código único e `checked_in` default false.
2. `eventMetrics` como única definição de ocupação, receita e contagens do painel.
3. `purchaseTicket` com o lock descrito na spec.
4. Formulário da vitrine exige participante logado e cartão de 16 dígitos.
5. Teste de rajada: 30 `inject` paralelos, lotação 5, repetido em três eventos. Esperado: 5×202, 25×409, 5 linhas.

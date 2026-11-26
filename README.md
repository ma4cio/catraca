# Catraca

Ingressos para eventos pequenos: shows em bar, workshops e meetups. O produto sobe com um comando, a partir de um clone limpo, com a seed já carregada.

## Como rodar

Pré-requisitos: Docker com `docker compose`, Git e Node.js 22 ou mais recente. O runtime do produto é o container; o Node do host só é necessário para os scripts `node scripts/*.mjs`. No Linux e no macOS, os comandos abaixo bastam.

Subir (build, banco, seed e espera do healthcheck):

```bash
docker compose up --build -d --wait
```

Derrubar tudo o que a subida iniciou:

```bash
docker compose down --remove-orphans
```

Gates (testes automatizados, inclusive concorrência de vagas). Os atrasos do gateway dentro dos testes são curtos; o serviço no ar usa os atrasos do brief:

```bash
bash scripts/gates.sh
```

Equivalentes que chamam o mesmo Docker, se preferir Node: `node scripts/up.mjs`, `node scripts/down.mjs` e `node scripts/gates.mjs`.

Com o produto no ar, rode `node scripts/evaluator.mjs` para exercitar via HTTP os passos 1 a 16 com o gateway padrão. O [workflow de aceitação](.github/workflows/acceptance.yml) também roda os gates, verifica o encerramento do ambiente e valida as contas da seed após a segunda subida, no passo 17.

Subir de novo depois de derrubar funciona: a seed é idempotente.

## Endereços

O produto e a API de parceiros estão no mesmo processo.

- `$WEB`: http://127.0.0.1:3000
- `$API`: http://127.0.0.1:3000

## Credenciais

A seed cria estas contas. A senha não muda se a seed rodar de novo.

| Quem | E-mail | Senha |
| --- | --- | --- |
| Organizador A | ana.organizadora@catraca.local | senha-organizador-a |
| Organizador B | bruno.organizador@catraca.local | senha-organizador-b |
| Participante | paula.participante@catraca.local | senha-participante |

Chave de parceiro, no cabeçalho `X-Api-Key`: `partner_key_catraca_dev`

Não há chave de pagamento. O modo padrão usa o gateway simulado.

## Mapa dos artefatos

- PRD: [docs/prd.md](docs/prd.md)
- Estado do projeto: [docs/state.json](docs/state.json)
- Porta de entrada dos agentes: [AGENTS.md](AGENTS.md)
- Features (spec, plano, contrato e relatórios):
  - [docs/features/F01-identidade](docs/features/F01-identidade)
  - [docs/features/F02-eventos](docs/features/F02-eventos)
  - [docs/features/F03-gateway](docs/features/F03-gateway)
  - [docs/features/F04-compras](docs/features/F04-compras)
  - [docs/features/F05-parceiros](docs/features/F05-parceiros)
  - [docs/features/F06-checkin](docs/features/F06-checkin)
  - [docs/features/F07-cancelamento](docs/features/F07-cancelamento)

Wave paralela (wave 4). As duas features foram implementadas em worktrees separadas. Os PRs registram o histórico de cada branch.

- [F05 API de parceiros — PR #1](https://github.com/ma4cio/catraca/pull/1).
- [F06 Check-in — PR #2](https://github.com/ma4cio/catraca/pull/2).

## Decisões

Stack: Node.js 22, Fastify e Postgres 16. Um processo serve a vitrine, a área do organizador e a API. O Postgres e o processo rodam em Docker, então a máquina do avaliador não precisa de outro runtime. HTML renderizado no servidor evita um frontend separado; o brief não avalia aparência.

Datas digitadas na interface são horário de parede de `America/Sao_Paulo` (`-03:00`). A API devolve `startsAt` nesse offset. O fluxo do avaliador usa datas com pelo menos um dia de folga, então a regra "data no futuro" não depende do fuso de quem testa.

R07: cada compra abre uma transação e trava a linha do evento com `SELECT … FOR UPDATE` antes de contar ingressos `pending` e `confirmed` e inserir o novo. Compras do mesmo evento entram na fila desse lock. A resposta 202 só sai depois do commit, e `sold_out` não insere linha. A prova automática dispara 30 compras paralelas, três vezes, em eventos de lotação 5, e exige 5 respostas 202, 25 respostas 409 e exatamente 5 linhas na tabela.

Gateway: a compra grava o ingresso `pending`, o preço daquele instante, o final do cartão e o instante `settle_at`. A resposta HTTP não espera o gateway. Um timer e uma varredura a cada 500 ms liquidam o ingresso quando o prazo chega. Cartões `0001` e `0002` esperam de 2 a 4 segundos; `0003` e `0004`, de 33 a 40 segundos. Assim a confirmação do `0001` cabe na janela de 5 segundos do avaliador, o `0004` ainda ocupa vaga antes dos 30 segundos, e aos 45 segundos a liquidação já ocorreu. Nos testes, `GATEWAY_*_MS` encolhe essas janelas. O `docker compose` do produto não define essas variáveis. Se o evento já foi cancelado, a liquidação não aplica aprovado nem recusado.

Avaliação: quem implementa uma feature não escreve o relatório dela. Cada relatório nasce numa sessão ou subagente de contexto vazio, contra o contrato, e não é editado depois do commit que o criou. O arquivo de estado aponta o relatório mais recente.

## Regras de entrega

Um projeto por repositório. Os PRs da wave paralela permanecem visíveis no GitHub depois do merge; as branches podem ser apagadas.

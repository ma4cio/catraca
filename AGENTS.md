# AGENTS.md

Porta de entrada de quem for alterar a Catraca. Se a ferramenta ler outro arquivo (por exemplo `CLAUDE.md`), ele só aponta para este.

## Comandos

Na raiz do clone:

```bash
docker compose up --build -d --wait
docker compose down --remove-orphans
bash scripts/gates.sh
```

Os mesmos efeitos via Node, se o host tiver Node 22: `node scripts/up.mjs`, `node scripts/down.mjs`, `node scripts/gates.mjs`.

Não suba o produto com atraso de gateway reduzido. `GATEWAY_FAST_*` e `GATEWAY_SLOW_*` existem só para os testes. O compose do serviço não os define.

## Regras do projeto

- As regras de produto são R01–R13, no [docs/prd.md](docs/prd.md). Não invente comportamento fora do PRD e do brief.
- Vagas ocupadas são só ingressos `pending` e `confirmed`. O cálculo mora em `src/metrics.js`. Compra, painel, vitrine e API usam essa função. Não conte de outro jeito.
- A compra concorrente trava a linha do evento (`FOR UPDATE`) antes de contar e inserir. Não cheque vaga fora dessa transação e depois insira.
- Preço do ingresso é o `price_cents` gravado na compra. Editar o evento não reescreve ingressos já criados.
- Cancelar é irreversível e acontece na mesma transação: evento `cancelled`, confirmados `refunded`, pendentes `cancelled`. Resposta tardia do gateway não muda esses status.
- Check-in segue a ordem do contrato, com as frases exatas. `checkedIn` não é status.
- Organizador só opera evento cujo `organizer_id` é o dele. A checagem acontece antes de renderizar nome, números ou ingressos. Participante e visitante recebem 403 sem dados do evento.
- API de parceiros: sem `X-Api-Key` válida, 401 `unauthorized`, antes de validar o corpo. Depois: 422 `invalid_request`, 404 `event_not_available`, 409 `sold_out`.
- Relatório de avaliação não se edita. Correção gera relatório novo. `docs/state.json` aponta o mais recente.
- Não commite segredo real. A chave de parceiro do README é a de desenvolvimento.

## Mapa

| Artefato | Caminho |
| --- | --- |
| PRD | `docs/prd.md` |
| Estado | `docs/state.json` |
| Features | `docs/features/F01-identidade` … `F07-cancelamento` |
| Schema | `db/schema.sql` |
| Métricas de vaga e painel | `src/metrics.js` |
| Compra e liquidação | `src/purchases.js` |
| Gateway simulado | `src/gateway.js` |
| Check-in | `src/checkin.js` |
| Testes dos gates | `test/acceptance.test.js` |

Wave paralela prevista no PRD: wave 4, F05 e F06, em branches separadas, integradas por PR.

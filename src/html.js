import { formatBrl, formatDateTimeLocal, formatOffsetIso, STATUS_LABELS } from './format.js';

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function priceInput(cents) {
  const reais = Math.floor(cents / 100);
  const centavos = String(cents % 100).padStart(2, '0');
  return `${reais},${centavos}`;
}

export function layout(title, body, user) {
  const links = ['<a href="/">Vitrine</a>'];
  if (!user) {
    links.push('<a href="/login">Entrar</a>', '<a href="/register">Cadastrar</a>');
  } else if (user.role === 'organizer') {
    links.push('<a href="/organizer/events">Meus eventos</a>', '<form method="post" action="/logout"><button type="submit">Sair</button></form>');
  } else {
    links.push('<a href="/me/tickets">Meus ingressos</a>', '<form method="post" action="/logout"><button type="submit">Sair</button></form>');
  }
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Georgia, serif; margin: 2rem auto; max-width: 46rem; line-height: 1.45; color: #1c1917; }
    nav { display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; }
    form.inline, nav form { display: inline; }
    label { display: block; margin-top: 0.8rem; }
    input, button { font: inherit; }
    .error { color: #9f1239; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border-bottom: 1px solid #d6d3d1; text-align: left; padding: 0.4rem; }
    article { border-top: 1px solid #d6d3d1; padding: 0.8rem 0; }
  </style>
</head>
<body>
  <nav>${links.join('')}</nav>
  <main>${body}</main>
</body>
</html>`;
}

export function eventForm(values = {}, error = '', action = '') {
  const actionAttr = action ? ` action="${escapeHtml(action)}"` : '';
  return `<form method="post"${actionAttr}>
    ${error ? `<p class="error">${escapeHtml(error)}</p>` : ''}
    <label>Nome <input name="name" required value="${escapeHtml(values.name ?? '')}"></label>
    <label>Início <input name="startsAt" type="datetime-local" required value="${escapeHtml(values.startsAt ?? '')}"></label>
    <label>Local <input name="venue" required value="${escapeHtml(values.venue ?? '')}"></label>
    <label>Lotação <input name="capacity" required inputmode="numeric" value="${escapeHtml(values.capacity ?? '')}"></label>
    <label>Preço (R$) <input name="price" required value="${escapeHtml(values.price ?? '')}"></label>
    <button type="submit">Salvar</button>
  </form>`;
}

export function storefrontPage(user, events) {
  const cards = events.length
    ? events.map((event) => {
      const soldOut = event.available <= 0;
      return `<article>
        <h2><a href="/events/${escapeHtml(event.id)}">${escapeHtml(event.name)}</a></h2>
        <p>${escapeHtml(formatOffsetIso(new Date(event.starts_at)))} · ${escapeHtml(event.venue)}</p>
        <p>${escapeHtml(formatBrl(event.price_cents))}</p>
        <p>${soldOut ? 'Ingressos esgotados' : `${event.available} vagas disponíveis`}</p>
      </article>`;
    }).join('')
    : '<p>Nenhum evento publicado.</p>';
  return layout('Vitrine', `<h1>Vitrine</h1>${cards}`, user);
}

export function eventPage({ event, available, user, message = '' }) {
  let action = '';
  if (available <= 0) {
    action = '<p id="sold-out">Ingressos esgotados</p>';
  } else if (!user) {
    action = '<p><a href="/login">Entre para comprar</a></p>';
  } else if (user.role !== 'participant') {
    action = '<p>Somente participantes compram ingressos.</p>';
  } else {
    action = `<form method="post" action="/events/${escapeHtml(event.id)}/purchase">
      ${message ? `<p class="error">${escapeHtml(message)}</p>` : ''}
      <label>Número do cartão <input name="cardNumber" inputmode="numeric" required minlength="16" maxlength="16"></label>
      <button type="submit">Comprar ingresso</button>
    </form>`;
  }
  const body = `<h1>${escapeHtml(event.name)}</h1>
    <p>${escapeHtml(formatOffsetIso(new Date(event.starts_at)))}</p>
    <p>${escapeHtml(event.venue)}</p>
    <p>${escapeHtml(formatBrl(event.price_cents))}</p>
    ${action}`;
  return layout(event.name, body, user);
}

export function ticketsPage(user, tickets) {
  const rows = tickets.length
    ? tickets.map((ticket) => `<tr data-event="${escapeHtml(ticket.event_name)}">
        <td class="event">${escapeHtml(ticket.event_name)}</td>
        <td class="status">${escapeHtml(STATUS_LABELS[ticket.status] ?? ticket.status)}</td>
        <td class="code">${escapeHtml(ticket.code)}</td>
      </tr>`).join('')
    : '<tr><td colspan="3">Você ainda não comprou ingressos.</td></tr>';
  const body = `<h1>Meus ingressos</h1>
    <table>
      <thead><tr><th>Evento</th><th>Status</th><th>Código</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  return layout('Meus ingressos', body, user);
}

export function managementPage({ user, event, metrics, error = '' }) {
  const panel = `<section id="painel">
    <h2>Painel</h2>
    <p>Confirmados: <strong id="m-confirmados">${metrics.confirmed}</strong></p>
    <p>Pendentes: <strong id="m-pendentes">${metrics.pending}</strong></p>
    <p>Check-ins: <strong id="m-checkins">${metrics.checkins}</strong></p>
    <p>Vagas disponíveis: <strong id="m-vagas">${metrics.available}</strong></p>
    <p>Receita: <strong id="m-receita">${escapeHtml(formatBrl(metrics.revenueCents))}</strong></p>
    <p>Estornados: <strong id="m-estornados">${metrics.refunded}</strong></p>
  </section>`;
  let editor = '';
  if (event.status === 'cancelled') {
    editor = '<p>Este evento está cancelado e não pode ser editado.</p>';
  } else {
    editor = eventForm({
      name: event.name,
      startsAt: formatDateTimeLocal(new Date(event.starts_at)),
      venue: event.venue,
      capacity: String(event.capacity),
      price: priceInput(event.price_cents),
    }, error);
    if (event.status === 'draft') {
      editor += `<form method="post" action="/organizer/events/${escapeHtml(event.id)}/publish"><button type="submit">Publicar</button></form>`;
    }
  }
  const statusLabel = { draft: 'rascunho', published: 'publicado', cancelled: 'cancelado' }[event.status];
  const body = `<h1 id="event-name">${escapeHtml(event.name)}</h1>
    <p>Situação: ${statusLabel}</p>
    ${panel}
    ${editor}`;
  return layout(event.name, body, user);
}

export function organizerListPage(user, events) {
  const items = events.length
    ? `<ul>${events.map((event) => `<li><a href="/organizer/events/${escapeHtml(event.id)}">${escapeHtml(event.name)}</a></li>`).join('')}</ul>`
    : '<p>Nenhum evento ainda.</p>';
  const body = `<h1>Meus eventos</h1>${items}<p><a href="/organizer/events/new">Criar evento</a></p>`;
  return layout('Meus eventos', body, user);
}

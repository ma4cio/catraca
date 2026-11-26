const timers = new Set();

export function scheduleSettle(ticketId, delayMs, settle) {
  const timer = setTimeout(() => {
    timers.delete(timer);
    Promise.resolve(settle(ticketId)).catch((error) => {
      console.error('falha ao liquidar ingresso', ticketId, error);
    });
  }, Math.max(0, delayMs));
  timers.add(timer);
}

export function clearSchedules() {
  for (const timer of timers) clearTimeout(timer);
  timers.clear();
}

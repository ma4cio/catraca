import { run } from './docker.mjs';

await run(['compose', 'up', '-d', 'db']);

const deadline = Date.now() + 60000;
let ready = false;
while (Date.now() < deadline) {
  const code = await run(['compose', 'exec', '-T', 'db', 'pg_isready', '-U', 'catraca', '-d', 'catraca'], {
    allowFailure: true,
  });
  if (code === 0) {
    ready = true;
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
if (!ready) throw new Error('Postgres não ficou pronto');

await run(
  ['compose', 'exec', '-T', 'db', 'psql', '-U', 'catraca', '-d', 'postgres', '-c', 'CREATE DATABASE catraca_test'],
  { allowFailure: true },
);

await run(['compose', 'build', 'app']);
await run([
  'compose', 'run', '--rm',
  '-e', 'DATABASE_URL=postgres://catraca:catraca@db:5432/catraca_test',
  '-e', 'PARTNER_API_KEY=partner_key_catraca_dev',
  '-e', 'SESSION_SECRET=catraca-dev-session-secret',
  '-e', 'GATEWAY_FAST_MIN_MS=800',
  '-e', 'GATEWAY_FAST_MAX_MS=1200',
  '-e', 'GATEWAY_SLOW_MIN_MS=3000',
  '-e', 'GATEWAY_SLOW_MAX_MS=3500',
  'app', 'npm', 'test',
]);
console.log('Gates ok');

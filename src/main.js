import { buildApp } from './app.js';
import { config } from './config.js';
import { migrate, waitForDb } from './db.js';
import { seed } from './seed.js';
import { resumePending } from './worker.js';

await waitForDb();
await migrate();
await seed();
await resumePending();
const app = await buildApp();
await app.listen({ port: config.port, host: '0.0.0.0' });
console.log(`Catraca ouvindo na porta ${config.port}`);

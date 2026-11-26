import { run } from './docker.mjs';

await run(['compose', 'down', '--remove-orphans']);
console.log('Catraca encerrada');

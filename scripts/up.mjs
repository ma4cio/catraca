import { run, waitForHttp } from './docker.mjs';

await run(['compose', 'up', '--build', '-d']);
await waitForHttp('http://127.0.0.1:3000/health', 240000);
console.log('Catraca no ar em http://127.0.0.1:3000');

import { spawn } from 'node:child_process';

export function run(args, { allowFailure = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0 || allowFailure) resolve(code ?? 1);
      else reject(new Error(`docker ${args.join(' ')} encerrou com código ${code}`));
    });
  });
}

export async function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`tempo esgotado esperando ${url}`);
}

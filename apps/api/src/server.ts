import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createApp } from './app.ts';
import { NotesRepository } from './repository.ts';

const databasePath = resolve(
  import.meta.dir,
  '..',
  process.env.DATABASE_PATH ?? 'data/soft-notes.sqlite',
);
mkdirSync(dirname(databasePath), { recursive: true });

const repository = new NotesRepository(databasePath);
const host = process.env.HOST ?? '127.0.0.1';
const token = process.env.API_TOKEN;
if (!['127.0.0.1', 'localhost', '::1'].includes(host) && !token) {
  repository.close();
  throw new Error('Set API_TOKEN before exposing the server beyond localhost.');
}
const app = createApp(repository, {token});
const port = Number(process.env.PORT ?? 4000);

const server = Bun.serve({
  hostname: host,
  port,
  fetch: app.fetch,
});

console.log(`Soft Notes API listening on http://${server.hostname}:${server.port}`);

function shutdown() {
  server.stop(true);
  repository.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

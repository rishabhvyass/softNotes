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
const app = createApp(repository);
const port = Number(process.env.PORT ?? 4000);

const server = Bun.serve({
  hostname: process.env.HOST ?? '0.0.0.0',
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


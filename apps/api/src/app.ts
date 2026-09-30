import { DeletedNoteError, NotesRepository } from './repository.ts';
import {timingSafeEqual} from 'node:crypto';
import type { NoteScope } from './types.ts';
import {
  ValidationError,
  validateNoteDraft,
  validateNotePatch,
} from './validation.ts';

const VALID_SCOPES = new Set<NoteScope>([
  'active',
  'saved',
  'archived',
  'trashed',
  'all',
]);
const MAX_REQUEST_BYTES = 256 * 1024;

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Cache-Control': 'no-store',
    },
  });
}

async function readJson(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > MAX_REQUEST_BYTES) {
    throw new ValidationError('Request body is too large.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ValidationError('Request body must be valid JSON.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const {value, done} = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new ValidationError('Request body is too large.');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ValidationError('Request body must be valid JSON.');
  }
}

export function createApp(repository: NotesRepository, options: {token?: string} = {}) {
  return {
    async fetch(request: Request): Promise<Response> {
      if (request.method === 'OPTIONS') return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        },
      });

      const url = new URL(request.url);
      const path = url.pathname.replace(/\/$/, '') || '/';
      if (path.startsWith('/api/') && options.token) {
        const supplied = Buffer.from(request.headers.get('Authorization') ?? '');
        const expected = Buffer.from(`Bearer ${options.token}`);
        if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
          return json({error: 'A valid API token is required.'}, 401);
        }
      }

      try {
        if (request.method === 'GET' && path === '/health') {
          return json({ status: 'ok', service: 'soft-notes-api' });
        }

        if (request.method === 'GET' && path === '/api/notes') {
          const requestedScope = url.searchParams.get('scope') ?? 'active';
          const scope = VALID_SCOPES.has(requestedScope as NoteScope)
            ? (requestedScope as NoteScope)
            : 'active';
          return json({
            notes: repository.list(scope, url.searchParams.get('q') ?? ''),
          });
        }

        if (request.method === 'GET' && path === '/api/sync') {
          return json({notes: repository.list('all'), deletedIds: repository.deletedIds()});
        }

        if (request.method === 'POST' && path === '/api/notes') {
          const note = repository.create(validateNoteDraft(await readJson(request)));
          return json({ note }, 201);
        }

        if (request.method === 'GET' && path === '/api/export') {
          return json({ exportedAt: new Date().toISOString(), notes: repository.exportAll() });
        }

        const restoreMatch = path.match(/^\/api\/notes\/([^/]+)\/restore$/);
        if (request.method === 'POST' && restoreMatch?.[1]) {
          const note = repository.restore(decodeURIComponent(restoreMatch[1]));
          return note ? json({ note }) : json({ error: 'Note not found.' }, 404);
        }

        const noteMatch = path.match(/^\/api\/notes\/([^/]+)$/);
        if (noteMatch?.[1]) {
          const id = decodeURIComponent(noteMatch[1]);
          if (request.method === 'GET') {
            const note = repository.get(id);
            return note ? json({ note }) : json({ error: 'Note not found.' }, 404);
          }
          if (request.method === 'PATCH') {
            if (repository.isPermanentlyDeleted(id)) throw new DeletedNoteError();
            const note = repository.update(id, validateNotePatch(await readJson(request)));
            return note ? json({ note }) : json({ error: 'Note not found.' }, 404);
          }
          if (request.method === 'DELETE') {
            if (url.searchParams.get('permanent') === 'true') {
              return repository.deleteForever(id)
                ? json({ deleted: true })
                : json({ error: 'Note not found.' }, 404);
            }
            const note = repository.trash(id);
            return note ? json({ note }) : json({ error: 'Note not found.' }, 404);
          }
        }

        return json({ error: 'Route not found.' }, 404);
      } catch (error) {
        if (error instanceof DeletedNoteError) return json({error: error.message}, 410);
        if (error instanceof ValidationError) {
          return json({ error: error.message }, 400);
        }
        console.error(error);
        return json({ error: 'Unexpected server error.' }, 500);
      }
    },
  };
}

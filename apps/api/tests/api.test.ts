import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createApp } from '../src/app.ts';
import { NotesRepository } from '../src/repository.ts';

describe('Soft Notes API', () => {
  let repository: NotesRepository;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    repository = new NotesRepository(':memory:');
    app = createApp(repository);
  });

  afterEach(() => repository.close());

  test('creates, searches, favorites, trashes, and restores a note', async () => {
    const createResponse = await app.fetch(
      new Request('http://local/api/notes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'Buy fresh cherries',
          body: 'Pick them up after work.',
          icon: 'heart',
          accent: '#FF8FB4',
          tags: ['personal', 'errands'],
        }),
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as { note: { id: string } };

    const favoriteResponse = await app.fetch(
      new Request(`http://local/api/notes/${created.note.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isFavorite: true }),
      }),
    );
    expect(favoriteResponse.status).toBe(200);

    const searchResponse = await app.fetch(
      new Request('http://local/api/notes?scope=saved&q=cherries'),
    );
    const search = (await searchResponse.json()) as { notes: unknown[] };
    expect(search.notes).toHaveLength(1);

    const trashResponse = await app.fetch(
      new Request(`http://local/api/notes/${created.note.id}`, { method: 'DELETE' }),
    );
    expect(trashResponse.status).toBe(200);

    const trashed = (await (
      await app.fetch(new Request('http://local/api/notes?scope=trashed'))
    ).json()) as { notes: unknown[] };
    expect(trashed.notes).toHaveLength(1);

    const restoreResponse = await app.fetch(
      new Request(`http://local/api/notes/${created.note.id}/restore`, { method: 'POST' }),
    );
    expect(restoreResponse.status).toBe(200);
  });

  test('rejects malformed note data', async () => {
    const response = await app.fetch(
      new Request('http://local/api/notes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: '', body: 12, icon: 'nope', accent: 'pink' }),
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Title is required.' });
  });

  test('allows a bodyless CORS preflight', async () => {
    const response = await app.fetch(new Request('http://local/api/notes', {method: 'OPTIONS'}));
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
  });

  test('rejects oversized bodies even without a content-length header', async () => {
    const response = await app.fetch(new Request('http://local/api/notes', {
      method: 'POST', body: JSON.stringify({body: 'a'.repeat(300_000)}),
    }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({error: 'Request body is too large.'});
  });
});

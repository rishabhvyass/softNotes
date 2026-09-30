import type {Note} from '../types/note';

export type SyncSnapshot = {notes: Note[]; deletedIds: string[]};
type NoteResponse = {note: Note};

export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

function endpoint(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

async function requestJson<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(endpoint(baseUrl, path), {
      ...init,
      headers: {'Content-Type': 'application/json', ...init?.headers},
      signal: controller.signal,
    });
    const body = (await response.json()) as T & {error?: string};
    if (!response.ok) {
      throw new ApiError(body.error ?? 'The server request failed.', response.status);
    }
    return body;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('The server took too long to respond.');
    }
    throw new ApiError('Could not reach the notes server.');
  } finally {
    clearTimeout(timeout);
  }
}

export const notesApi = {
  async snapshot(baseUrl: string): Promise<SyncSnapshot> {
    return requestJson<SyncSnapshot>(baseUrl, '/api/sync');
  },

  async create(baseUrl: string, note: Note): Promise<Note> {
    const result = await requestJson<NoteResponse>(baseUrl, '/api/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    });
    if (note.deletedAt) return this.update(baseUrl, note);
    return result.note;
  },

  async update(baseUrl: string, note: Note): Promise<Note> {
    const result = await requestJson<NoteResponse>(
      baseUrl,
      `/api/notes/${encodeURIComponent(note.id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          title: note.title,
          body: note.body,
          icon: note.icon,
          accent: note.accent,
          tags: note.tags,
          isFavorite: note.isFavorite,
          isArchived: note.isArchived,
          deletedAt: note.deletedAt,
          updatedAt: note.updatedAt,
        }),
      },
    );
    return result.note;
  },

  async deleteForever(baseUrl: string, id: string): Promise<void> {
    await requestJson(baseUrl, `/api/notes/${encodeURIComponent(id)}?permanent=true`, {
      method: 'DELETE',
    });
  },
};

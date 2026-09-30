import { Database } from 'bun:sqlite';
import type { Note, NoteDraft, NotePatch, NoteScope } from './types.ts';

type NoteRow = {
  id: string;
  title: string;
  body: string;
  icon: Note['icon'];
  accent: string;
  tags_json: string;
  is_favorite: number;
  is_archived: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

const SELECT_COLUMNS = `
  id, title, body, icon, accent, tags_json, is_favorite, is_archived,
  deleted_at, created_at, updated_at
`;

function rowToNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    icon: row.icon,
    accent: row.accent,
    tags: JSON.parse(row.tags_json) as string[],
    isFavorite: Boolean(row.is_favorite),
    isArchived: Boolean(row.is_archived),
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class NotesRepository {
  readonly db: Database;

  constructor(filename = './data/soft-notes.sqlite') {
    this.db = new Database(filename, { create: true, strict: true });
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL DEFAULT '',
        icon TEXT NOT NULL,
        accent TEXT NOT NULL,
        tags_json TEXT NOT NULL DEFAULT '[]',
        is_favorite INTEGER NOT NULL DEFAULT 0 CHECK (is_favorite IN (0, 1)),
        is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0, 1)),
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes(updated_at DESC);
      CREATE INDEX IF NOT EXISTS notes_favorite_idx ON notes(is_favorite, updated_at DESC);
      CREATE INDEX IF NOT EXISTS notes_archived_idx ON notes(is_archived, updated_at DESC);
    `);
  }

  list(scope: NoteScope, query = ''): Note[] {
    const conditions: string[] = [];
    const bindings: Record<string, string> = {};

    if (scope === 'active') {
      conditions.push('deleted_at IS NULL', 'is_archived = 0');
    } else if (scope === 'saved') {
      conditions.push('deleted_at IS NULL', 'is_archived = 0', 'is_favorite = 1');
    } else if (scope === 'archived') {
      conditions.push('deleted_at IS NULL', 'is_archived = 1');
    } else if (scope === 'trashed') {
      conditions.push('deleted_at IS NOT NULL');
    }

    const normalizedQuery = query.trim();
    if (normalizedQuery) {
      conditions.push(
        `(title LIKE $query ESCAPE '\\' OR body LIKE $query ESCAPE '\\' OR tags_json LIKE $query ESCAPE '\\')`,
      );
      bindings.query = `%${normalizedQuery
        .replaceAll('\\', '\\\\')
        .replaceAll('%', '\\%')
        .replaceAll('_', '\\_')}%`;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = this.db
      .query<NoteRow, Record<string, string>>(
        `SELECT ${SELECT_COLUMNS} FROM notes ${where} ORDER BY updated_at DESC`,
      )
      .all(bindings);
    return rows.map(rowToNote);
  }

  get(id: string): Note | null {
    const row = this.db
      .query<NoteRow, { id: string }>(
        `SELECT ${SELECT_COLUMNS} FROM notes WHERE id = $id`,
      )
      .get({ id });
    return row ? rowToNote(row) : null;
  }

  create(draft: NoteDraft): Note {
    const id = draft.id ?? crypto.randomUUID();
    const now = new Date().toISOString();
    const createdAt = draft.createdAt ?? now;
    const updatedAt = draft.updatedAt ?? now;

    this.db
      .query(`
        INSERT INTO notes (
          id, title, body, icon, accent, tags_json, is_favorite,
          is_archived, deleted_at, created_at, updated_at
        ) VALUES (
          $id, $title, $body, $icon, $accent, $tagsJson, $isFavorite,
          $isArchived, NULL, $createdAt, $updatedAt
        )
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          body = excluded.body,
          icon = excluded.icon,
          accent = excluded.accent,
          tags_json = excluded.tags_json,
          is_favorite = excluded.is_favorite,
          is_archived = excluded.is_archived,
          updated_at = excluded.updated_at
        WHERE excluded.updated_at >= notes.updated_at
      `)
      .run({
        id,
        title: draft.title,
        body: draft.body,
        icon: draft.icon,
        accent: draft.accent,
        tagsJson: JSON.stringify(draft.tags ?? []),
        isFavorite: draft.isFavorite ? 1 : 0,
        isArchived: draft.isArchived ? 1 : 0,
        createdAt,
        updatedAt,
      });

    const note = this.get(id);
    if (!note) throw new Error('The note could not be created.');
    return note;
  }

  update(id: string, patch: NotePatch): Note | null {
    const current = this.get(id);
    if (!current) return null;

    const next: Note = {
      ...current,
      ...patch,
      updatedAt: patch.updatedAt ?? new Date().toISOString(),
    };

    const result = this.db
      .query(`
        UPDATE notes SET
          title = $title,
          body = $body,
          icon = $icon,
          accent = $accent,
          tags_json = $tagsJson,
          is_favorite = $isFavorite,
          is_archived = $isArchived,
          deleted_at = $deletedAt,
          updated_at = $updatedAt
        WHERE id = $id AND updated_at <= $updatedAt
      `)
      .run({
        id,
        title: next.title,
        body: next.body,
        icon: next.icon,
        accent: next.accent,
        tagsJson: JSON.stringify(next.tags),
        isFavorite: next.isFavorite ? 1 : 0,
        isArchived: next.isArchived ? 1 : 0,
        deletedAt: next.deletedAt,
        updatedAt: next.updatedAt,
      });

    return result.changes > 0 ? this.get(id) : current;
  }

  trash(id: string): Note | null {
    return this.update(id, { deletedAt: new Date().toISOString() });
  }

  restore(id: string): Note | null {
    return this.update(id, { deletedAt: null, isArchived: false });
  }

  deleteForever(id: string): boolean {
    return this.db.query('DELETE FROM notes WHERE id = $id').run({ id }).changes > 0;
  }

  exportAll(): Note[] {
    return this.list('all');
  }

  close(): void {
    this.db.close();
  }
}


export const NOTE_ICONS = [
  'spark',
  'idea',
  'heart',
  'book',
  'briefcase',
  'leaf',
  'music',
  'travel',
  'home',
  'health',
  'check',
  'star',
] as const;

export type NoteIcon = (typeof NOTE_ICONS)[number];

export type Note = {
  id: string;
  title: string;
  body: string;
  icon: NoteIcon;
  accent: string;
  tags: string[];
  isFavorite: boolean;
  isArchived: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NoteInput = Pick<Note, 'title' | 'body' | 'icon' | 'accent'> & {
  tags?: string[];
};

export type ComposeDraft = {title: string; body: string; tags: string; icon: NoteIcon; accent: string};

export type NotePatch = Partial<
  Pick<
    Note,
    | 'title'
    | 'body'
    | 'icon'
    | 'accent'
    | 'tags'
    | 'isFavorite'
    | 'isArchived'
    | 'deletedAt'
  >
>;

export type CollectionScope = 'active' | 'saved' | 'archived' | 'trashed';
export type ThemePreference = 'system' | 'light' | 'dark';

export type AppSettings = {
  apiUrl: string;
  hapticsEnabled: boolean;
  theme: ThemePreference;
};

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

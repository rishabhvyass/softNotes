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

export type NoteDraft = Pick<Note, 'title' | 'body' | 'icon' | 'accent'> & {
  id?: string;
  tags?: string[];
  isFavorite?: boolean;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

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
    | 'updatedAt'
  >
>;

export type NoteScope = 'active' | 'saved' | 'archived' | 'trashed' | 'all';


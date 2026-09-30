import {NOTE_ICONS, type Note} from '../types/note';

export function normalizeTags(value: string | string[]): string[] {
  const tags = typeof value === 'string' ? value.split(',') : value;
  return [...new Set(tags.map(tag => tag.trim().replace(/^#/, '').toLowerCase()).filter(Boolean))];
}

export function validateContent(title: string, body: string, tags: string[]): string | null {
  if (!title.trim()) return 'A title is required.';
  if (title.trim().length > 160) return 'Titles can have up to 160 characters.';
  if (body.length > 50_000) return 'Notes can have up to 50,000 characters.';
  if (tags.length > 12 || tags.some(tag => tag.length > 32)) return 'Use up to 12 tags, each 32 characters or fewer.';
  return null;
}

export function parseNote(value: unknown): Note {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid note in backup.');
  const item = value as Record<string, unknown>;
  const validDate = (date: unknown): date is string => typeof date === 'string' && Number.isFinite(Date.parse(date));
  if (typeof item.id !== 'string' || !item.id.trim() || item.id.length > 128 ||
      typeof item.title !== 'string' || typeof item.body !== 'string' ||
      typeof item.icon !== 'string' || !NOTE_ICONS.includes(item.icon as Note['icon']) ||
      typeof item.accent !== 'string' || !/^#[0-9a-f]{6}$/i.test(item.accent) ||
      !Array.isArray(item.tags) || !item.tags.every(tag => typeof tag === 'string') ||
      typeof item.isFavorite !== 'boolean' || typeof item.isArchived !== 'boolean' ||
      !validDate(item.createdAt) || !validDate(item.updatedAt) ||
      (item.deletedAt !== null && !validDate(item.deletedAt))) {
    throw new Error('A backup note has missing or invalid fields.');
  }
  const tags = normalizeTags(item.tags as string[]);
  const error = validateContent(item.title, item.body, tags);
  if (error) throw new Error(error);
  return {
    id: item.id.trim(), title: item.title.trim(), body: item.body,
    icon: item.icon as Note['icon'], accent: item.accent.toUpperCase(), tags,
    isFavorite: item.isFavorite, isArchived: item.isArchived,
    createdAt: new Date(item.createdAt).toISOString(), updatedAt: new Date(item.updatedAt).toISOString(),
    deletedAt: item.deletedAt === null ? null : new Date(item.deletedAt as string).toISOString(),
  };
}

import { NOTE_ICONS, type NoteDraft, type NotePatch } from './types.ts';

const MAX_TITLE_LENGTH = 160;
const MAX_BODY_LENGTH = 50_000;
const MAX_TAGS = 12;
const MAX_TAG_LENGTH = 32;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateTitle(value: unknown): string {
  if (typeof value !== 'string') {
    throw new ValidationError('Title must be a string.');
  }
  const title = value.trim();
  if (!title) {
    throw new ValidationError('Title is required.');
  }
  if (title.length > MAX_TITLE_LENGTH) {
    throw new ValidationError(`Title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
  }
  return title;
}

function validateBody(value: unknown): string {
  if (typeof value !== 'string') {
    throw new ValidationError('Body must be a string.');
  }
  if (value.length > MAX_BODY_LENGTH) {
    throw new ValidationError(`Body must be ${MAX_BODY_LENGTH} characters or fewer.`);
  }
  return value;
}

function validateIcon(value: unknown): NoteDraft['icon'] {
  if (typeof value !== 'string' || !NOTE_ICONS.includes(value as NoteDraft['icon'])) {
    throw new ValidationError('Choose a supported note icon.');
  }
  return value as NoteDraft['icon'];
}

function validateAccent(value: unknown): string {
  if (typeof value !== 'string' || !HEX_COLOR.test(value)) {
    throw new ValidationError('Accent must be a six-digit hex color.');
  }
  return value.toUpperCase();
}

function validateTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new ValidationError('Tags must be an array.');
  }
  if (value.length > MAX_TAGS) {
    throw new ValidationError(`A note can have up to ${MAX_TAGS} tags.`);
  }

  return [...new Set(value.map(tag => {
    if (typeof tag !== 'string') {
      throw new ValidationError('Every tag must be a string.');
    }
    const normalized = tag.trim().toLowerCase();
    if (!normalized || normalized.length > MAX_TAG_LENGTH) {
      throw new ValidationError(`Tags must be 1-${MAX_TAG_LENGTH} characters long.`);
    }
    return normalized;
  }))];
}

function validateBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new ValidationError(`${field} must be a boolean.`);
  }
  return value;
}

function validateDate(value: unknown, field: string): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new ValidationError(`${field} must be a valid ISO date.`);
  }
  return new Date(value).toISOString();
}

export function validateNoteDraft(value: unknown): NoteDraft {
  if (!isRecord(value)) {
    throw new ValidationError('Request body must be a JSON object.');
  }

  return {
    ...(typeof value.id === 'string' && value.id.trim() ? { id: value.id.trim() } : {}),
    title: validateTitle(value.title),
    body: validateBody(value.body),
    icon: validateIcon(value.icon),
    accent: validateAccent(value.accent),
    tags: value.tags === undefined ? [] : validateTags(value.tags),
    isFavorite:
      value.isFavorite === undefined
        ? false
        : validateBoolean(value.isFavorite, 'isFavorite'),
    isArchived:
      value.isArchived === undefined
        ? false
        : validateBoolean(value.isArchived, 'isArchived'),
    ...(value.createdAt === undefined
      ? {}
      : { createdAt: validateDate(value.createdAt, 'createdAt') }),
    ...(value.updatedAt === undefined
      ? {}
      : { updatedAt: validateDate(value.updatedAt, 'updatedAt') }),
  };
}

export function validateNotePatch(value: unknown): NotePatch {
  if (!isRecord(value)) {
    throw new ValidationError('Request body must be a JSON object.');
  }

  const patch: NotePatch = {};
  if ('title' in value) patch.title = validateTitle(value.title);
  if ('body' in value) patch.body = validateBody(value.body);
  if ('icon' in value) patch.icon = validateIcon(value.icon);
  if ('accent' in value) patch.accent = validateAccent(value.accent);
  if ('tags' in value) patch.tags = validateTags(value.tags);
  if ('isFavorite' in value) {
    patch.isFavorite = validateBoolean(value.isFavorite, 'isFavorite');
  }
  if ('isArchived' in value) {
    patch.isArchived = validateBoolean(value.isArchived, 'isArchived');
  }
  if ('deletedAt' in value) {
    patch.deletedAt =
      value.deletedAt === null ? null : validateDate(value.deletedAt, 'deletedAt');
  }
  if ('updatedAt' in value) {
    patch.updatedAt = validateDate(value.updatedAt, 'updatedAt');
  }

  if (Object.keys(patch).length === 0) {
    throw new ValidationError('Provide at least one field to update.');
  }
  return patch;
}


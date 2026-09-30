import AsyncStorage from '@react-native-async-storage/async-storage';
import type {AppSettings, ComposeDraft, Note} from '../types/note';
import {NOTE_ICONS} from '../types/note';
import {parseNote} from '../utils/noteValidation';

const STORAGE_KEY = '@soft-notes/app-state/v1';

export type PersistedState = {
  notes: Note[];
  settings: AppSettings;
  pendingDeletions: string[];
  composeDraft: ComposeDraft | null;
};

export async function loadPersistedState(): Promise<PersistedState | null> {
  const serialized = await AsyncStorage.getItem(STORAGE_KEY);
  if (!serialized) return null;
  try {
    const parsed = JSON.parse(serialized) as Partial<PersistedState>;
    if (!Array.isArray(parsed.notes) || !parsed.settings) return null;
    return {
      notes: parsed.notes.map(parseNote),
      settings: parsed.settings,
      pendingDeletions: Array.isArray(parsed.pendingDeletions)
        ? parsed.pendingDeletions.filter(id => typeof id === 'string')
        : [],
      composeDraft: validDraft(parsed.composeDraft) ? parsed.composeDraft : null,
    };
  } catch {
    return null;
  }
}

function validDraft(draft: unknown): draft is ComposeDraft {
  if (!draft || typeof draft !== 'object') return false;
  const value = draft as ComposeDraft;
  return typeof value.title === 'string' && value.title.length <= 160 &&
    typeof value.body === 'string' && value.body.length <= 50_000 &&
    typeof value.tags === 'string' && value.tags.length <= 1000 &&
    NOTE_ICONS.includes(value.icon) && typeof value.accent === 'string' && /^#[0-9a-f]{6}$/i.test(value.accent);
}

export async function savePersistedState(state: PersistedState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}


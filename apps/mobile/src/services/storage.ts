import AsyncStorage from '@react-native-async-storage/async-storage';
import type {AppSettings, Note} from '../types/note';

const STORAGE_KEY = '@soft-notes/app-state/v1';

export type PersistedState = {
  notes: Note[];
  settings: AppSettings;
  pendingDeletions: string[];
};

export async function loadPersistedState(): Promise<PersistedState | null> {
  const serialized = await AsyncStorage.getItem(STORAGE_KEY);
  if (!serialized) return null;
  try {
    const parsed = JSON.parse(serialized) as Partial<PersistedState>;
    if (!Array.isArray(parsed.notes) || !parsed.settings) return null;
    return {
      notes: parsed.notes,
      settings: parsed.settings,
      pendingDeletions: Array.isArray(parsed.pendingDeletions)
        ? parsed.pendingDeletions
        : [],
    };
  } catch {
    return null;
  }
}

export async function savePersistedState(state: PersistedState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearPersistedState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}


import NetInfo from '@react-native-community/netinfo';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import {AppState, Platform} from 'react-native';
import {seedNotes} from '../data/seedNotes';
import {ApiError, notesApi} from '../services/api';
import {
  loadPersistedState,
  savePersistedState,
} from '../services/storage';
import type {
  AppSettings,
  CollectionScope,
  ComposeDraft,
  Note,
  NoteInput,
  NotePatch,
} from '../types/note';
import {notesReducer, type NotesState} from './notesReducer';
import {normalizeTags} from '../utils/noteValidation';

const defaultSettings: AppSettings = {
  apiUrl: Platform.select({
    android: 'http://10.0.2.2:4000',
    default: 'http://127.0.0.1:4000',
  })!,
  hapticsEnabled: true,
  theme: 'system',
};

const initialState: NotesState = {
  notes: [],
  settings: defaultSettings,
  pendingDeletions: [],
  composeDraft: null,
  hydrated: false,
  isOnline: true,
  syncStatus: 'idle',
  error: null,
};

type NotesContextValue = NotesState & {
  createNote(input: NoteInput): Note;
  updateNote(id: string, patch: NotePatch): void;
  toggleFavorite(id: string): void;
  archiveNote(id: string): void;
  trashNote(id: string): void;
  restoreNote(id: string): void;
  deleteForever(id: string): void;
  updateSettings(patch: Partial<AppSettings>): void;
  updateComposeDraft(draft: ComposeDraft | null): void;
  importNotes(notes: Note[]): void;
  syncNow(): Promise<void>;
  selectNotes(scope: CollectionScope, query?: string): Note[];
};

const NotesContext = createContext<NotesContextValue | null>(null);

export function NotesProvider({children}: {children: React.ReactNode}) {
  const [state, dispatch] = useReducer(notesReducer, initialState);
  const latestState = useRef(state);
  latestState.current = state;
  const syncing = useRef(false);
  const syncRequested = useRef(false);
  const persistenceQueue = useRef<Promise<void>>(Promise.resolve());
  const generation = useRef(0);

  useEffect(() => {
    loadPersistedState()
      .then(persisted => {
        dispatch({
          type: 'hydrate',
          notes: persisted?.notes ?? seedNotes,
          settings: {...defaultSettings, ...persisted?.settings},
          pendingDeletions: persisted?.pendingDeletions ?? [],
          composeDraft: persisted?.composeDraft ?? null,
        });
      })
      .catch(() => {
        dispatch({
          type: 'hydrate',
          notes: seedNotes,
          settings: defaultSettings,
          pendingDeletions: [],
        });
      });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const persisted = {
      notes: state.notes,
      settings: state.settings,
      pendingDeletions: state.pendingDeletions,
      composeDraft: state.composeDraft,
    };
    // Serialize writes so a slower earlier save cannot overwrite a later edit.
    persistenceQueue.current = persistenceQueue.current
      .catch(() => {})
      .then(() => savePersistedState(persisted))
      .catch(() => {
        dispatch({type: 'sync', status: 'error', error: 'Could not save notes locally.'});
      });
  }, [state.hydrated, state.notes, state.pendingDeletions, state.settings, state.composeDraft]);

  const syncNow = useCallback(async () => {
    const snapshot = latestState.current;
    if (!snapshot.hydrated || !snapshot.isOnline) return;
    if (syncing.current) {
      syncRequested.current = true;
      return;
    }
    syncing.current = true;
    syncRequested.current = false;
    const currentGeneration = generation.current;
    dispatch({type: 'sync', status: 'syncing', error: null});

    try {
      const remote = await notesApi.snapshot(snapshot.settings.apiUrl);
      const deletedIds = new Set(remote.deletedIds);

      for (const id of snapshot.pendingDeletions) {
        await notesApi.deleteForever(snapshot.settings.apiUrl, id);
      }

      for (const note of snapshot.notes) {
        if (deletedIds.has(note.id)) continue;
        const remoteNote = remote.notes.find(candidate => candidate.id === note.id);
        try {
          if (!remoteNote) {
            await notesApi.create(snapshot.settings.apiUrl, note);
          } else if (Date.parse(note.updatedAt) > Date.parse(remoteNote.updatedAt)) {
            await notesApi.update(snapshot.settings.apiUrl, note);
          }
        } catch (error) {
          // Another device may permanently delete a note during this upload.
          if (!(error instanceof ApiError && error.status === 410)) throw error;
        }
      }

      const refreshedRemote = await notesApi.snapshot(snapshot.settings.apiUrl);
      if (generation.current === currentGeneration) {
        dispatch({
          type: 'syncMerge',
          notes: refreshedRemote.notes,
          remoteDeletions: refreshedRemote.deletedIds,
          acknowledgedDeletions: snapshot.pendingDeletions,
        });
        dispatch({type: 'sync', status: 'synced', error: null});
      }
    } catch (error) {
      if (generation.current !== currentGeneration) return;
      dispatch({
        type: 'sync',
        status: 'error',
        error: error instanceof Error ? error.message : 'Sync failed.',
      });
    } finally {
      syncing.current = false;
      if (syncRequested.current) setTimeout(() => syncNow(), 100);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(network => {
      // A local Bun server remains reachable on LAN even without internet access.
      const isOnline = Boolean(network.isConnected);
      dispatch({type: 'network', isOnline});
      if (isOnline) setTimeout(() => syncNow(), 150);
    });
    return unsubscribe;
  }, [syncNow]);

  useEffect(() => {
    if (state.hydrated) syncNow();
  }, [state.hydrated, syncNow]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') syncNow();
    });
    return () => subscription.remove();
  }, [syncNow]);

  const createNote = useCallback(
    (input: NoteInput): Note => {
      const now = new Date().toISOString();
      const note: Note = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
        title: input.title.trim(),
        body: input.body,
        icon: input.icon,
        accent: input.accent,
        tags: normalizeTags(input.tags ?? []),
        isFavorite: false,
        isArchived: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      dispatch({type: 'create', note});
      setTimeout(() => syncNow(), 0);
      return note;
    },
    [syncNow],
  );

  const updateNote = useCallback(
    (id: string, patch: NotePatch) => {
      dispatch({type: 'update', id, patch: {...patch, ...(patch.tags ? {tags: normalizeTags(patch.tags)} : {})}, updatedAt: new Date().toISOString()});
      setTimeout(() => syncNow(), 0);
    },
    [syncNow],
  );

  const findNote = useCallback(
    (id: string) => latestState.current.notes.find(note => note.id === id),
    [],
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      const note = findNote(id);
      if (note) updateNote(id, {isFavorite: !note.isFavorite});
    },
    [findNote, updateNote],
  );

  const archiveNote = useCallback(
    (id: string) => updateNote(id, {isArchived: true, deletedAt: null}),
    [updateNote],
  );
  const trashNote = useCallback(
    (id: string) => updateNote(id, {deletedAt: new Date().toISOString()}),
    [updateNote],
  );
  const restoreNote = useCallback(
    (id: string) => updateNote(id, {deletedAt: null, isArchived: false}),
    [updateNote],
  );
  const deleteForever = useCallback(
    (id: string) => {
      dispatch({type: 'deleteForever', id});
      setTimeout(() => syncNow(), 0);
    },
    [syncNow],
  );

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    if (patch.apiUrl) generation.current += 1;
    dispatch({type: 'settings', patch});
  }, []);

  const updateComposeDraft = useCallback((draft: ComposeDraft | null) => {
    dispatch({type: 'draft', draft});
  }, []);

  const importNotes = useCallback((notes: Note[]) => {
    dispatch({type: 'import', notes});
    setTimeout(() => syncNow(), 0);
  }, [syncNow]);

  const selectNotes = useCallback(
    (scope: CollectionScope, query = '') => {
      const normalized = query.trim().toLowerCase();
      return state.notes
        .filter(note => {
          if (scope === 'active') return !note.deletedAt && !note.isArchived;
          if (scope === 'saved') return !note.deletedAt && !note.isArchived && note.isFavorite;
          if (scope === 'archived') return !note.deletedAt && note.isArchived;
          return Boolean(note.deletedAt);
        })
        .filter(note => {
          if (!normalized) return true;
          return [note.title, note.body, ...note.tags]
            .join(' ')
            .toLowerCase()
            .includes(normalized);
        })
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    },
    [state.notes],
  );

  const value = useMemo<NotesContextValue>(
    () => ({
      ...state,
      createNote,
      updateNote,
      toggleFavorite,
      archiveNote,
      trashNote,
      restoreNote,
      deleteForever,
      updateSettings,
      updateComposeDraft,
      importNotes,
      syncNow,
      selectNotes,
    }),
    [
      state,
      createNote,
      updateNote,
      toggleFavorite,
      archiveNote,
      trashNote,
      restoreNote,
      deleteForever,
      updateSettings,
      updateComposeDraft,
      importNotes,
      syncNow,
      selectNotes,
    ],
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes(): NotesContextValue {
  const context = useContext(NotesContext);
  if (!context) throw new Error('useNotes must be used inside NotesProvider.');
  return context;
}

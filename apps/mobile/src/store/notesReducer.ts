import type {AppSettings, ComposeDraft, Note, NotePatch, SyncStatus} from '../types/note';

export type NotesState = {
  notes: Note[];
  settings: AppSettings;
  pendingDeletions: string[];
  composeDraft: ComposeDraft | null;
  hydrated: boolean;
  isOnline: boolean;
  syncStatus: SyncStatus;
  error: string | null;
};

export type NotesAction =
  | {type: 'hydrate'; notes: Note[]; settings: AppSettings; pendingDeletions: string[]; composeDraft?: ComposeDraft | null}
  | {type: 'create'; note: Note}
  | {type: 'update'; id: string; patch: NotePatch; updatedAt: string}
  | {type: 'syncMerge'; notes: Note[]; acknowledgedDeletions: string[]; remoteDeletions?: string[]}
  | {type: 'deleteForever'; id: string}
  | {type: 'settings'; patch: Partial<AppSettings>}
  | {type: 'network'; isOnline: boolean}
  | {type: 'sync'; status: SyncStatus; error?: string | null}
  | {type: 'draft'; draft: ComposeDraft | null}
  | {type: 'import'; notes: Note[]};

export function notesReducer(state: NotesState, action: NotesAction): NotesState {
  switch (action.type) {
    case 'hydrate':
      return {...state, notes: action.notes, settings: action.settings, pendingDeletions: action.pendingDeletions, composeDraft: action.composeDraft ?? null, hydrated: true};
    case 'create':
      return {...state, notes: [action.note, ...state.notes], error: null};
    case 'update':
      return {
        ...state,
        notes: state.notes.map(note =>
          note.id === action.id ? {...note, ...action.patch, updatedAt: action.updatedAt} : note,
        ),
        error: null,
      };
    case 'syncMerge': {
      // Merge against current state, not the snapshot captured before the network call.
      // An edit or deletion made while syncing must win over an older response.
      const acknowledged = new Set(action.acknowledgedDeletions);
      return {
        ...state,
        notes: mergeNotes(state.notes, action.notes, [...state.pendingDeletions, ...action.remoteDeletions ?? []]),
        pendingDeletions: state.pendingDeletions.filter(id => !acknowledged.has(id)),
      };
    }
    case 'deleteForever':
      return {
        ...state,
        notes: state.notes.filter(note => note.id !== action.id),
        pendingDeletions: [...new Set([...state.pendingDeletions, action.id])],
      };
    case 'settings':
      return {...state, settings: {...state.settings, ...action.patch}};
    case 'network':
      return {...state, isOnline: action.isOnline, syncStatus: action.isOnline ? state.syncStatus : 'offline'};
    case 'sync':
      return {...state, syncStatus: action.status, error: action.error === undefined ? state.error : action.error};
    case 'draft':
      return {...state, composeDraft: action.draft};
    case 'import':
      return {...state, notes: mergeNotes(state.notes, action.notes, state.pendingDeletions), error: null};
  }
}

export function mergeNotes(local: Note[], remote: Note[], deletedIds: string[]): Note[] {
  const deleted = new Set(deletedIds);
  const byId = new Map<string, Note>();
  for (const note of [...remote, ...local]) {
    if (deleted.has(note.id)) continue;
    const existing = byId.get(note.id);
    if (!existing || Date.parse(note.updatedAt) >= Date.parse(existing.updatedAt)) {
      byId.set(note.id, note);
    }
  }
  return [...byId.values()].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

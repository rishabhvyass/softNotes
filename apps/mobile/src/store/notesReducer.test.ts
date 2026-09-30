import type {Note} from '../types/note';
import {mergeNotes, notesReducer, type NotesState} from './notesReducer';

const note: Note = {
  id: 'one',
  title: 'First note',
  body: 'Body',
  icon: 'spark',
  accent: '#72B8FF',
  tags: [],
  isFavorite: false,
  isArchived: false,
  deletedAt: null,
  createdAt: '2026-09-30T09:00:00.000Z',
  updatedAt: '2026-09-30T09:00:00.000Z',
};

const state: NotesState = {
  notes: [note],
  settings: {apiUrl: 'http://local', hapticsEnabled: true, theme: 'system'},
  pendingDeletions: [],
  hydrated: true,
  isOnline: true,
  syncStatus: 'idle',
  error: null,
};

describe('notesReducer', () => {
  it('updates notes optimistically', () => {
    const next = notesReducer(state, {
      type: 'update',
      id: note.id,
      patch: {isFavorite: true},
      updatedAt: '2026-09-30T10:00:00.000Z',
    });
    expect(next.notes[0]?.isFavorite).toBe(true);
    expect(next.notes[0]?.updatedAt).toBe('2026-09-30T10:00:00.000Z');
  });

  it('keeps a deletion tombstone for offline sync', () => {
    const next = notesReducer(state, {type: 'deleteForever', id: note.id});
    expect(next.notes).toEqual([]);
    expect(next.pendingDeletions).toEqual([note.id]);
  });

  it('preserves edits and deletions made while a sync request is in flight', () => {
    const edited = {...note, title: 'New local title', updatedAt: '2026-09-30T11:00:00.000Z'};
    const localState = {...state, notes: [edited], pendingDeletions: ['new-deletion', 'old-deletion']};
    const next = notesReducer(localState, {
      type: 'syncMerge',
      notes: [note, {...note, id: 'new-deletion'}],
      acknowledgedDeletions: ['old-deletion'],
    });
    expect(next.notes).toEqual([edited]);
    expect(next.pendingDeletions).toEqual(['new-deletion']);
  });
});

describe('mergeNotes', () => {
  it('keeps the newest copy and does not resurrect deleted ids', () => {
    const remote = {...note, title: 'Remote old title', updatedAt: '2026-09-30T08:00:00.000Z'};
    expect(mergeNotes([note], [remote], [note.id])).toEqual([]);
    expect(mergeNotes([note], [remote], [])[0]?.title).toBe('First note');
  });
});

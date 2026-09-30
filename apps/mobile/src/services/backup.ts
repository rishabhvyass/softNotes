import type {Note} from '../types/note';
import {parseNote} from '../utils/noteValidation';

export function exportBackup(notes: Note[]): string {
  return JSON.stringify({format: 'softnotes', version: 1, exportedAt: new Date().toISOString(), notes}, null, 2);
}

export function importBackup(serialized: string): Note[] {
  if (serialized.length > 5_000_000) throw new Error('This backup is too large. Limit: 5 MB of text.');
  let parsed: unknown;
  try { parsed = JSON.parse(serialized); } catch { throw new Error('Paste a valid JSON backup.'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid backup format.');
  const backup = parsed as Record<string, unknown>;
  if (backup.format !== 'softnotes' || backup.version !== 1 || !Array.isArray(backup.notes)) {
    throw new Error('Use a version 1 SoftNotes backup.');
  }
  if (backup.notes.length > 5000) throw new Error('A backup can contain up to 5,000 notes.');
  const notes = backup.notes.map(parseNote);
  if (new Set(notes.map(note => note.id)).size !== notes.length) throw new Error('This backup contains duplicate note IDs.');
  return notes;
}

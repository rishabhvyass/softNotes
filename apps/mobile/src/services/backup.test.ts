import {seedNotes} from '../data/seedNotes';
import {exportBackup, importBackup} from './backup';

describe('personal backups', () => {
  it('round trips the full library without exporting server settings', () => {
    const output = exportBackup(seedNotes);
    expect(importBackup(output)).toEqual(seedNotes);
    expect(output).not.toContain('apiUrl');
  });
  it('rejects corrupt, unsupported, duplicate, and oversized imports', () => {
    expect(() => importBackup('not JSON')).toThrow('valid JSON');
    expect(() => importBackup('{"notes":[]}')).toThrow('version 1');
    expect(() => importBackup(exportBackup([{...seedNotes[0], icon: 'broken'} as never]))).toThrow('invalid fields');
    expect(() => importBackup(exportBackup([seedNotes[0], seedNotes[0]]))).toThrow('duplicate');
    expect(() => importBackup('a'.repeat(5_000_001))).toThrow('too large');
  });
});

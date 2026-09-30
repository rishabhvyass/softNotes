import AsyncStorage from '@react-native-async-storage/async-storage';
import {loadPersistedState, loadRecoveryData} from './storage';

beforeEach(async () => { await AsyncStorage.clear(); });

it('preserves corrupt local data instead of silently discarding it', async () => {
  const original = '{"notes": [broken JSON';
  await AsyncStorage.setItem('@soft-notes/app-state/v1', original);
  await expect(loadPersistedState()).rejects.toThrow('preserved');
  expect(await loadRecoveryData()).toBe(original);
  expect(await AsyncStorage.getItem('@soft-notes/app-state/v1')).toBe(original);
});

it('distinguishes a new install from corrupt data', async () => {
  expect(await loadPersistedState()).toBeNull();
  expect(await loadRecoveryData()).toBeNull();
});

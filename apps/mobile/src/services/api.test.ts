import {notesApi, ApiError} from './api';

afterEach(() => jest.restoreAllMocks());

it('includes the configured token in sync requests', async () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({ok: true, json: async () => ({notes: [], deletedIds: []})} as Response);
  await expect(notesApi.snapshot('https://my-server/', 'private-token')).resolves.toEqual({notes: [], deletedIds: []});
  expect(fetchMock).toHaveBeenCalledWith('https://my-server/api/sync', expect.objectContaining({headers: expect.objectContaining({Authorization: 'Bearer private-token'})}));
});

it('surfaces unauthorized errors without losing the response status', async () => {
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({ok: false, status: 401, json: async () => ({error: 'A valid API token is required.'})} as Response);
  await expect(notesApi.snapshot('http://local')).rejects.toEqual(new ApiError('A valid API token is required.', 401));
});

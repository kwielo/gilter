import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAccessToken } from '../google-auth';
import {
  createFilter,
  deleteFilter,
  getFilter,
  listFilters,
  listLabels,
} from '../gmail-api';

vi.mock('../google-auth', () => ({
  getAccessToken: vi.fn(),
}));

const mockedToken = vi.mocked(getAccessToken);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('gmail-api', () => {
  beforeEach(() => {
    mockedToken.mockReturnValue('access-token');
    vi.stubGlobal('fetch', vi.fn());
  });

  it('throws when there is no access token', async () => {
    mockedToken.mockReturnValue(null);
    await expect(listFilters()).rejects.toThrow(/Not authenticated/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('lists filters and sends the bearer token', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({
      filter: [{ id: '1', criteria: {}, action: {} }],
    }));

    await expect(listFilters()).resolves.toEqual([
      { id: '1', criteria: {}, action: {} },
    ]);
    expect(fetch).toHaveBeenCalledWith(
      'https://gmail.googleapis.com/gmail/v1/users/me/settings/filters',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
      }),
    );
  });

  it('returns an empty list when the filters response omits filter', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}));
    await expect(listFilters()).resolves.toEqual([]);
  });

  it('gets, creates, and deletes filters', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ id: 'a/b', criteria: {}, action: {} }))
      .mockResolvedValueOnce(jsonResponse({ id: 'new', criteria: { from: 'x' }, action: {} }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(getFilter('a/b')).resolves.toMatchObject({ id: 'a/b' });
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/settings/filters/a%2Fb');

    await expect(createFilter({ criteria: { from: 'x' }, action: {} })).resolves.toMatchObject({ id: 'new' });
    expect(vi.mocked(fetch).mock.calls[1][1]).toMatchObject({ method: 'POST' });

    await expect(deleteFilter('a/b')).resolves.toBeUndefined();
    expect(vi.mocked(fetch).mock.calls[2][1]).toMatchObject({ method: 'DELETE' });
  });

  it('lists labels and defaults to an empty array', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ labels: [{ id: 'Label_1', name: 'Work', type: 'user' }] }));
    await expect(listLabels()).resolves.toEqual([{ id: 'Label_1', name: 'Work', type: 'user' }]);

    vi.mocked(fetch).mockResolvedValue(jsonResponse({}));
    await expect(listLabels()).resolves.toEqual([]);
  });

  it('surfaces Gmail API error messages', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ error: { message: 'Quota exceeded' } }, 403));
    await expect(listFilters()).rejects.toThrow('Gmail API 403: Quota exceeded');

    vi.mocked(fetch).mockResolvedValue(new Response('plain failure', { status: 500 }));
    await expect(listFilters()).rejects.toThrow('Gmail API 500: plain failure');
  });
});

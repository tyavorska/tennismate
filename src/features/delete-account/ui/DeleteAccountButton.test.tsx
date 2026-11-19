import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQuery } from '@/shared/testing';
import { DeleteAccountButton } from '../index';

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

function respondWith(response: Response): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function openAndSubmit(password: string): Promise<void> {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Delete account' }));
  const dialog = await screen.findByRole('dialog');
  await user.type(within(dialog).getByLabelText('Confirm with your password'), password);
  await user.click(within(dialog).getByRole('button', { name: 'Delete my account' }));
}

beforeEach(() => {
  router.replace.mockReset();
  router.refresh.mockReset();
});

afterEach(() => vi.unstubAllGlobals());

describe('DeleteAccountButton', () => {
  it('deletes the account with the password and leaves for the landing page', async () => {
    const fetchMock = respondWith(new Response(null, { status: 204 }));
    renderWithQuery(<DeleteAccountButton />);

    await openAndSubmit('serve-and-volley');

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
    expect(router.refresh).toHaveBeenCalled();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/me');
    expect(fetchMock.mock.calls[0]?.[1].method).toBe('DELETE');
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1].body)).toEqual({ password: 'serve-and-volley' });
  });

  it('shows the wrong password on the field and stays signed in', async () => {
    respondWith(
      Response.json(
        { kind: 'validation', fieldErrors: { password: 'Password is incorrect.' } },
        { status: 422 },
      ),
    );
    renderWithQuery(<DeleteAccountButton />);

    await openAndSubmit('wrong-password');

    expect(await screen.findByText('Password is incorrect.')).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('shows a failure and keeps the dialog open when the server is down', async () => {
    respondWith(Response.json({ kind: 'server', requestId: 'abc' }, { status: 500 }));
    renderWithQuery(<DeleteAccountButton />);

    await openAndSubmit('serve-and-volley');

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('does not ask for a password until the button is pressed', () => {
    renderWithQuery(<DeleteAccountButton />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

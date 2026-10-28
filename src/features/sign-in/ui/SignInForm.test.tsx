import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQuery } from '@/shared/testing';
import { SignInForm } from '../index';

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

function respondWith(body: object, status: number): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue(Response.json(body, { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function fillAndSubmit(email: string, password: string): Promise<void> {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in with email' }));
}

beforeEach(() => {
  router.replace.mockReset();
  router.refresh.mockReset();
});

afterEach(() => vi.unstubAllGlobals());

describe('SignInForm', () => {
  describe('on success', () => {
    it('signs in and goes to the returnTo page', async () => {
      const fetchMock = respondWith(
        { id: '2f1c6c8e-9a43-4b8b-9a55-0f6a7b3a1d10', email: 'ana@example.com' },
        200,
      );
      renderWithQuery(<SignInForm returnTo="/account" />);

      await fillAndSubmit('Ana@Example.com', 'serve-and-volley');

      await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/account'));
      expect(router.refresh).toHaveBeenCalled();
      expect(JSON.parse(fetchMock.mock.calls[0]?.[1].body)).toEqual({
        email: 'ana@example.com',
        password: 'serve-and-volley',
      });
    });

    it('ignores a returnTo that points off the site', async () => {
      respondWith({ id: '2f1c6c8e-9a43-4b8b-9a55-0f6a7b3a1d10', email: 'ana@example.com' }, 200);
      renderWithQuery(<SignInForm returnTo="https://evil.example" />);

      await fillAndSubmit('ana@example.com', 'serve-and-volley');

      await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/home'));
    });
  });

  describe('on failure', () => {
    it('shows one message for a wrong email or password and keeps the input', async () => {
      respondWith({ kind: 'unauthenticated', message: 'Email or password is incorrect.' }, 401);
      renderWithQuery(<SignInForm />);

      await fillAndSubmit('ana@example.com', 'wrong-password');

      expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
      expect(screen.getByLabelText('Email')).toHaveValue('ana@example.com');
      expect(screen.getByLabelText('Password')).toHaveValue('wrong-password');
      expect(router.replace).not.toHaveBeenCalled();
    });

    it('says the server could not be reached when the network fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
      renderWithQuery(<SignInForm />);

      await fillAndSubmit('ana@example.com', 'serve-and-volley');

      expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't reach the server.");
    });

    it('shows a reference ID when the server fails', async () => {
      respondWith({ kind: 'server', requestId: 'abcdef12-3456' }, 500);
      renderWithQuery(<SignInForm />);

      await fillAndSubmit('ana@example.com', 'serve-and-volley');

      expect(await screen.findByRole('alert')).toHaveTextContent('Reference: abcdef12');
    });

    it('does not call the server when the email is invalid', async () => {
      const fetchMock = respondWith({}, 200);
      renderWithQuery(<SignInForm />);

      await fillAndSubmit('not-an-email', 'serve-and-volley');

      expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { citySchema } from '@/entities/city';
import { renderWithQuery } from '@/shared/testing';
import { SignUpForm } from '../index';

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const cities = [
  citySchema.parse({ id: 1, slug: 'krakow', name: 'Kraków', country: 'PL' }),
  citySchema.parse({ id: 2, slug: 'gdansk', name: 'Gdańsk', country: 'PL' }),
];

function respondWith(body: object, status: number): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue(Response.json(body, { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function fillIn(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(screen.getByLabelText('Email'), 'ana@example.com');
  await user.type(screen.getByLabelText('Password'), 'serve-and-volley');
}

async function chooseCity(user: ReturnType<typeof userEvent.setup>, name: string): Promise<void> {
  await user.click(screen.getByRole('button', { name: /City/ }));
  await user.click(screen.getByRole('option', { name }));
}

beforeEach(() => {
  router.replace.mockReset();
  router.refresh.mockReset();
});

afterEach(() => vi.unstubAllGlobals());

describe('SignUpForm', () => {
  it('asks for a city, with no city chosen to start with', () => {
    renderWithQuery(<SignUpForm cities={cities} />);

    expect(screen.getByRole('button', { name: /City/ })).toHaveTextContent('Choose your city');
  });

  it('lists the cities the app is open in', async () => {
    const user = userEvent.setup();
    renderWithQuery(<SignUpForm cities={cities} />);

    await user.click(screen.getByRole('button', { name: /City/ }));

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Kraków',
      'Gdańsk',
    ]);
  });

  it('sends the chosen city with the credentials and goes to the players page', async () => {
    const fetchMock = respondWith(
      { id: '2f1c6c8e-9a43-4b8b-9a55-0f6a7b3a1d10', email: 'ana@example.com' },
      201,
    );
    const user = userEvent.setup();
    renderWithQuery(<SignUpForm cities={cities} />);

    await fillIn(user);
    await chooseCity(user, 'Gdańsk');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/players'));
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1].body)).toEqual({
      email: 'ana@example.com',
      password: 'serve-and-volley',
      cityId: 2,
    });
  });

  it('does not call the server and says so when no city is chosen', async () => {
    const fetchMock = respondWith({}, 201);
    const user = userEvent.setup();
    renderWithQuery(<SignUpForm cities={cities} />);

    await fillIn(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /City/ })).toHaveAccessibleDescription(
        'Choose your city',
      ),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the server message under the city and keeps everything typed', async () => {
    respondWith(
      { kind: 'validation', fieldErrors: { cityId: 'Choose a city from the list.' } },
      422,
    );
    const user = userEvent.setup();
    renderWithQuery(<SignUpForm cities={cities} />);

    await fillIn(user);
    await chooseCity(user, 'Kraków');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Choose a city from the list.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('ana@example.com');
    expect(screen.getByRole('button', { name: /City/ })).toHaveTextContent('Kraków');
    expect(router.replace).not.toHaveBeenCalled();
  });
});

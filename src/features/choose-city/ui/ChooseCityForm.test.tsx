import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { citySchema } from '@/entities/city';
import { renderWithQuery } from '@/shared/testing';
import { ChooseCityForm } from '../index';

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const cities = [citySchema.parse({ id: 1, slug: 'krakow', name: 'Kraków', country: 'PL' })];

const player = {
  id: '2f1c6c8e-9a43-4b8b-9a55-0f6a7b3a1d10',
  name: 'Ana',
  rating: 3,
  neighborhood: 'Stare Miasto',
  city: { id: 1, name: 'Kraków' },
};

function respondWith(body: object, status: number): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue(Response.json(body, { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function chooseKrakow(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole('button', { name: /City/ }));
  await user.click(screen.getByRole('option', { name: 'Kraków' }));
}

beforeEach(() => {
  router.replace.mockReset();
  router.refresh.mockReset();
});

afterEach(() => vi.unstubAllGlobals());

describe('ChooseCityForm', () => {
  it('has one heading and a city select with nothing chosen', () => {
    renderWithQuery(<ChooseCityForm cities={cities} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Where do you play?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /City/ })).toHaveTextContent('Choose your city');
  });

  it('saves the city and goes to the players page', async () => {
    const fetchMock = respondWith(player, 201);
    const user = userEvent.setup();
    renderWithQuery(<ChooseCityForm cities={cities} />);

    await chooseKrakow(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/players'));
    expect(router.refresh).toHaveBeenCalled();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/me/profile');
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1].body)).toEqual({ cityId: 1 });
  });

  it('does not call the server when no city is chosen', async () => {
    const fetchMock = respondWith(player, 201);
    const user = userEvent.setup();
    renderWithQuery(<ChooseCityForm cities={cities} />);

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /City/ })).toHaveAccessibleDescription(
        'Choose your city',
      ),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the error and keeps the chosen city when saving fails', async () => {
    respondWith({ kind: 'server', requestId: 'abcdef12-3456' }, 500);
    const user = userEvent.setup();
    renderWithQuery(<ChooseCityForm cities={cities} />);

    await chooseKrakow(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Reference: abcdef12');
    expect(screen.getByRole('button', { name: /City/ })).toHaveTextContent('Kraków');
    expect(router.replace).not.toHaveBeenCalled();
  });
});

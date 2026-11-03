'use client';

import { useState } from 'react';
import { defaultFilters, emptyFilters, type PlayerFilters } from './playerFilters';

type PlayerFiltersState = Readonly<{
  filters: PlayerFilters;
  setFilters: (filters: PlayerFilters) => void;
  clear: () => void;
}>;

export function usePlayerFilters(): PlayerFiltersState {
  const [filters, setFilters] = useState<PlayerFilters>(defaultFilters);
  return { filters, setFilters, clear: () => setFilters(emptyFilters) };
}

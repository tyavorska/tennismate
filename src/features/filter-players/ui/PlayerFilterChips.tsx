'use client';

import type { ReactNode } from 'react';
import { ToggleChipGroup, type ToggleChipOption } from '@/shared/ui';
import { playerFilterLabels, playerFilterSchema, type PlayerFilter } from '../model/playerFilter';

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 11.5V6.5a1.5 1.5 0 0 1 3 0V11M10 10.5V4.5a1.5 1.5 0 0 1 3 0v6M13 10.5v-5a1.5 1.5 0 0 1 3 0v6M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5a6 6 0 0 1-4.6-2.2L4 15.2a1.6 1.6 0 0 1 2.4-2.1L8 14.5" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

const icons = {
  bestMatch: <SparkIcon />,
  readyToPlay: <WaveIcon />,
  nearby: <PinIcon />,
} as const satisfies Record<PlayerFilter, ReactNode>;

const options: readonly ToggleChipOption<PlayerFilter>[] = playerFilterSchema.options.map((id) => ({
  id,
  label: playerFilterLabels[id],
  icon: icons[id],
}));

type PlayerFilterChipsProps = {
  value: PlayerFilter;
  onChange: (value: PlayerFilter) => void;
};

export function PlayerFilterChips({ value, onChange }: PlayerFilterChipsProps) {
  return (
    <ToggleChipGroup label="Filter players" options={options} value={value} onChange={onChange} />
  );
}

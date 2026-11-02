import type { SelectOption } from '@/shared/ui';

/** Choices in the "let's play" invite until courts and free slots come from the backend. */
export const inviteCourts: readonly SelectOption[] = [
  'Kazimierz Clay Club',
  'Cracovia Tennis Club',
  'Park Jordana',
].map((name) => ({ id: name, label: name }));

export const inviteSlots = [
  'Tomorrow 10:00',
  'Tomorrow 12:00',
  'Wed 4 Nov 09:00',
  'Wed 4 Nov 18:00',
  'Thu 5 Nov 19:30',
] as const;

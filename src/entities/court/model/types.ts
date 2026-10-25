export type CourtSurface = 'hard' | 'clay' | 'grass';

export type Court = {
  id: string;
  name: string;
  city: string;
  surface: CourtSurface;
  courtCount: number;
  indoor: boolean;
};

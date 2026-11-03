type District = Readonly<{ name: string; latitude: number; longitude: number }>;
type Court = Readonly<{ name: string; district: string }>;

export type CityData = Readonly<{
  slug: string;
  name: string;
  country: string;
  timezone: string;
  /** The middle of the city. New players start in the district closest to it. */
  latitude: number;
  longitude: number;
  districts: readonly District[];
  courts: readonly Court[];
}>;

const krakowDistricts = [
  { name: 'Bronowice', latitude: 50.0802, longitude: 19.8905 },
  { name: 'Czyżyny', latitude: 50.0731, longitude: 20.0006 },
  { name: 'Dębniki', latitude: 50.0408, longitude: 19.9145 },
  { name: 'Kazimierz', latitude: 50.0516, longitude: 19.9467 },
  { name: 'Krowodrza', latitude: 50.0783, longitude: 19.9171 },
  { name: 'Nowa Huta', latitude: 50.0722, longitude: 20.0371 },
  { name: 'Podgórze', latitude: 50.0421, longitude: 19.9507 },
  { name: 'Prądnik', latitude: 50.0905, longitude: 19.9603 },
  { name: 'Ruczaj', latitude: 50.0225, longitude: 19.9022 },
  { name: 'Stare Miasto', latitude: 50.0614, longitude: 19.9366 },
  { name: 'Wola Justowska', latitude: 50.0702, longitude: 19.8602 },
  { name: 'Zabłocie', latitude: 50.0493, longitude: 19.9592 },
] as const;

const krakowCourts = [
  { name: 'Kazimierz Clay Club', district: 'Kazimierz' },
  { name: 'Cracovia Tennis Club', district: 'Stare Miasto' },
  { name: 'Błonia Park Tennis', district: 'Stare Miasto' },
  { name: 'Park Jordana', district: 'Krowodrza' },
  { name: 'Podgórze Indoor Arena', district: 'Podgórze' },
  { name: 'Ruczaj Campus Courts', district: 'Ruczaj' },
  { name: 'Zabłocie Rooftop Courts', district: 'Zabłocie' },
  { name: 'Nowa Huta Tennis Center', district: 'Nowa Huta' },
  { name: 'Prądnik Sports Club', district: 'Prądnik' },
  { name: 'Czyżyny Courts', district: 'Czyżyny' },
  { name: 'Bronowice Tennis Club', district: 'Bronowice' },
  { name: 'Dębniki Riverside Courts', district: 'Dębniki' },
  { name: 'Wola Justowska Tennis Park', district: 'Wola Justowska' },
] as const;

/** The cities the app is open in. A city only goes in once its districts and courts are listed. */
export const cityData: readonly CityData[] = [
  {
    slug: 'krakow',
    name: 'Kraków',
    country: 'PL',
    timezone: 'Europe/Warsaw',
    latitude: 50.0647,
    longitude: 19.945,
    districts: krakowDistricts,
    courts: krakowCourts,
  },
];

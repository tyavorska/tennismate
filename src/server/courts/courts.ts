import 'server-only';
import { z } from 'zod';
import { courtSchema, districtNameSchema, type Court } from '@/entities/court';
import { db } from '../db';

export function listCourts(cityId: number): readonly Court[] {
  const rows = db
    .prepare(
      `SELECT courts.name, districts.name AS district FROM courts
       JOIN districts ON districts.id = courts.district_id
       WHERE courts.city_id = ? AND courts.removed_at IS NULL`,
    )
    .all(cityId);
  // Sorted here, not in SQL, so Polish letters and numbers ("2" before "10") come out in order.
  return z
    .array(courtSchema)
    .parse(rows)
    .toSorted((a, b) => a.name.localeCompare(b.name, 'pl', { numeric: true }));
}

export function listDistricts(cityId: number): readonly string[] {
  const rows = db.prepare('SELECT name FROM districts WHERE city_id = ?').all(cityId);
  return z
    .array(districtNameSchema)
    .parse(rows.map((row) => row.name))
    .toSorted((a, b) => a.localeCompare(b, 'pl'));
}

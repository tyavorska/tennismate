import 'server-only';
import { z } from 'zod';
import { courtSchema, districtNameSchema, type Court } from '@/entities/court';
import { db } from '../db';

export function listCourts(cityId: number): readonly Court[] {
  const rows = db
    .prepare(
      `SELECT courts.name, districts.name AS district FROM courts
       JOIN districts ON districts.id = courts.district_id
       WHERE courts.city_id = ? ORDER BY courts.name`,
    )
    .all(cityId);
  return z.array(courtSchema).parse(rows);
}

export function listDistricts(cityId: number): readonly string[] {
  const rows = db.prepare('SELECT name FROM districts WHERE city_id = ? ORDER BY name').all(cityId);
  return z.array(districtNameSchema).parse(rows.map((row) => row.name));
}

import 'server-only';
import { z } from 'zod';
import { courtSchema, districtNameSchema, type Court } from '@/entities/court';
import { db } from '../db';

export function listCourts(): readonly Court[] {
  const rows = db.prepare('SELECT name, district FROM courts ORDER BY name').all();
  return z.array(courtSchema).parse(rows);
}

export function listDistricts(): readonly string[] {
  const rows = db.prepare('SELECT name FROM districts ORDER BY name').all();
  return z.array(districtNameSchema).parse(rows.map((row) => row.name));
}

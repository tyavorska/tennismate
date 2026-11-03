import { NextResponse } from 'next/server';
import type { City } from '@/entities/city';
import { listCities } from '@/server/cities';
import { unexpectedProblem } from '@/server/http';

// Open to everyone: the sign-up form needs the list before there is an account.
export function GET(): NextResponse {
  try {
    return NextResponse.json<readonly City[]>(listCities());
  } catch (error) {
    return unexpectedProblem('cities.list', error instanceof Error ? error : String(error));
  }
}

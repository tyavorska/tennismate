import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { unexpectedProblem } from '@/server/http';

// Open to everyone: the load balancer and the deploy job call it with no session.
export function GET(): NextResponse {
  try {
    db.prepare('SELECT 1').get();
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    return unexpectedProblem('health.check', error instanceof Error ? error : String(error));
  }
}

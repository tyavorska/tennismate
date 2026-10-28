import { NextResponse } from 'next/server';
import { deleteSession } from '@/server/auth';
import { unexpectedProblem } from '@/server/http';

export async function POST(): Promise<NextResponse> {
  try {
    await deleteSession();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return unexpectedProblem('sign-out', error instanceof Error ? error : String(error));
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/shared/database/db';
import { monitors, user } from '@/shared/database/schema';
import { count } from 'drizzle-orm';

export const revalidate = 300; // Cache 5 minutes

export async function GET() {
  try {
    const [{ value: totalMonitors }] = await db
      .select({ value: count() })
      .from(monitors);
    const [{ value: totalUsers }] = await db
      .select({ value: count() })
      .from(user);

    return NextResponse.json({
      monitors: totalMonitors,
      users: totalUsers,
    });
  } catch {
    return NextResponse.json({ monitors: 0, users: 0 });
  }
}

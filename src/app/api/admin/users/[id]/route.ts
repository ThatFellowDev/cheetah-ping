import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/shared/database/db';
import { user, monitors } from '@/shared/database/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

async function verifyAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const userData = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });
  if (!(userData as any)?.isAdmin) return null;
  return session.user;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  // Don't allow deleting yourself
  if (id === admin.id) {
    return NextResponse.json({ error: 'Cannot delete your own account from admin' }, { status: 400 });
  }

  await db.delete(user).where(eq(user.id, id));

  return NextResponse.json({ data: { success: true } });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.plan !== undefined) updates.plan = body.plan;
  if (body.isAdmin !== undefined) updates.isAdmin = body.isAdmin;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  await db.update(user).set(updates).where(eq(user.id, id));

  return NextResponse.json({ data: { success: true } });
}

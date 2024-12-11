import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { assignYSWSToUser } from '@/lib/airtable';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request: Request) {
  try {
    console.log('Attempting to get session...');
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session?.user?.id) {
      console.log('No user ID in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, ysws } = await request.json();

    if (!userId || !ysws) {
      return NextResponse.json({ error: 'Missing userId or ysws' }, { status: 400 });
    }

    // Only allow users to assign to themselves
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('Assigning YSWS:', ysws, 'to user:', userId);
    const success = await assignYSWSToUser(userId, ysws);
    if (!success) {
      return NextResponse.json({ error: 'Failed to assign YSWS' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API /ysws/assign - Error:', error);
    return NextResponse.json({ error: 'Failed to assign YSWS' }, { status: 500 });
  }
}
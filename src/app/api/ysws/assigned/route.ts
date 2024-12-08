import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getUserAssignedYSWS } from '@/lib/airtable';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request: Request) {
  try {
    console.log('Attempting to get session...');
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session?.user?.id) {
      console.log('No user ID in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Only allow users to fetch their own assigned YSWS
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('Getting assigned YSWS for user:', userId);
    const assigned = await getUserAssignedYSWS(userId);
    return NextResponse.json(assigned);
  } catch (error) {
    console.error('API /ysws/assigned - Error:', error);
    return NextResponse.json({ error: 'Failed to fetch assigned YSWS' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getAssignedYSWS } from '@/lib/airtable';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { headers } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const headersList = headers();
    console.log('Assigned prints - Request headers:', Object.fromEntries(headersList.entries()));
    
    const session = await getServerSession(authOptions);
    console.log('Assigned prints - Session:', session);

    if (!session?.user?.id) {
      console.error('Assigned prints - No user ID in session');
      return NextResponse.json({ error: 'Unauthorized - No user ID' }, { status: 401 });
    }

    // Only allow users to fetch their own assigned prints
    if (session.user.id !== params.userId) {
      console.error('Assigned prints - User tried to access another user\'s assigned prints');
      return NextResponse.json({ error: 'Forbidden - Wrong user' }, { status: 403 });
    }

    // Get the assigned YSWS details
    const assignedPrints = await getAssignedYSWS(session.user.Assigned_YSWS || []);
    console.log('Assigned prints - Prints:', assignedPrints);
    
    return NextResponse.json(assignedPrints);
  } catch (error) {
    console.error('Error fetching assigned print requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
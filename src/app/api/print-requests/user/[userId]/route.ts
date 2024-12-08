import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getUserYSWS } from '@/lib/airtable';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const requests = await getUserYSWS(params.userId);
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching user print requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
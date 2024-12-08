import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getOutstandingYSWS } from '@/lib/airtable';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request: Request) {
  try {
    const requests = await getOutstandingYSWS();
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching print requests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
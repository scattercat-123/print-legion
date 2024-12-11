import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { assignPrinter } from '@/lib/airtable'

export async function POST(request: Request) {
  const session = await getServerSession()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { requestId } = await request.json()
  
  if (!requestId) {
    return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
  }

  try {
    const success = await assignPrinter(requestId, session.user.id)
    
    if (success) {
      return NextResponse.json({ message: 'Request assigned successfully' })
    } else {
      return NextResponse.json({ error: 'Failed to assign request' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error assigning print request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
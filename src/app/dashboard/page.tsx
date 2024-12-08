'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PrinterIcon, StarIcon } from '@heroicons/react/24/outline';

interface DashboardProps {
  initialData?: {
    available: string[];
    assigned: string[];
  };
}

export default function Dashboard({ initialData }: DashboardProps) {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      console.log('User is not authenticated, redirecting to home');
      router.push('/');
    }
  });

  const [availableYSWS, setAvailableYSWS] = useState<string[]>(initialData?.available || []);
  const [assignedYSWS, setAssignedYSWS] = useState<string[]>(initialData?.assigned || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    if (initialData) {
      setAvailableYSWS(initialData.available);
      setAssignedYSWS(initialData.assigned);
    }
  }, [initialData]);

  useEffect(() => {
    console.log('Dashboard useEffect - Session status:', status);
    console.log('Dashboard useEffect - Session data:', session);
    if (session?.user) {
      console.log('Dashboard useEffect - User data:', {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        slack_id: session.user.slack_id,
        printer_has: session.user.printer_has,
        Assigned_YSWS: session.user.Assigned_YSWS
      });

      // Redirect if printer_has is false
      if (!session.user.printer_has) {
        router.push('/printer-status');
      }

      // Update assigned YSWS from session
      setAssignedYSWS(session.user.Assigned_YSWS || []);
    }
  }, [session, status]);

  const handleAssignYSWS = async (ysws: string) => {
    if (!session?.user?.id) {
      console.log('No user ID in session, cannot assign YSWS');
      return;
    }

    console.log('Attempting to assign YSWS:', ysws, 'to user:', session.user.id);
    
    try {
      setError(null);
      const response = await fetch('/api/ysws/assign', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ userId: session.user.id, ysws }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to assign YSWS:', response.status, errorText);
        throw new Error('Failed to assign YSWS');
      }

      console.log('Successfully assigned YSWS');

      // Update local state
      setAssignedYSWS(prev => [...prev, ysws]);
      setAvailableYSWS(prev => prev.filter(y => y !== ysws));
    } catch (error) {
      console.error('Error in handleAssignYSWS:', error);
      setError(error instanceof Error ? error.message : 'Failed to assign YSWS');
    }
  };

  if (status === 'loading' || loading) {
    console.log('Rendering loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session?.user) {
    console.log('No user in session, rendering null');
    return null;
  }

  console.log('Rendering dashboard with:', {
    availableYSWS: availableYSWS.length,
    assignedYSWS: assignedYSWS.length,
    error,
    user: {
      id: session.user.id,
      slack_id: session.user.slack_id,
      printer_has: session.user.printer_has
    }
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <PrinterIcon className="h-6 w-6 text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold">Dashboard</h3>
            </div>
            <div className="flex items-center space-x-4">
              <StarIcon className="h-6 w-6 text-yellow-500" />
              <span>{coins} Coins</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="px-4 py-2 mb-4 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}
        
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Available YSWS</h3>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {availableYSWS.length === 0 ? (
                  <li className="px-4 py-4 sm:px-6 text-gray-500">No available YSWS</li>
                ) : (
                  availableYSWS.map((ysws) => (
                    <li key={ysws} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-indigo-600">{ysws}</div>
                        <button
                          onClick={() => handleAssignYSWS(ysws)}
                          className="px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                        >
                          Assign
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Assigned YSWS</h3>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {assignedYSWS.length === 0 ? (
                  <li className="px-4 py-4 sm:px-6 text-gray-500">No assigned YSWS</li>
                ) : (
                  assignedYSWS.map((ysws) => (
                    <li key={ysws} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-indigo-600">{ysws}</div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PrinterIcon, CheckCircleIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import type { YSWS } from '@/lib/airtable';

export default function PrinterSelectPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/');
    },
  });
  const [outstandingRequests, setOutstandingRequests] = useState<YSWS[]>([]);
  const [assignedRequests, setAssignedRequests] = useState<YSWS[]>([]);
  const [availableYSWS, setAvailableYSWS] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRequests() {
      if (status !== 'authenticated' || !session?.user?.id) {
        return;
      }

      if (!session.user.printer_has) {
        router.push('/submissions');
        return;
      }
      
      try {
        setError(null);
        setLoading(true);
        
        // Fetch outstanding requests
        const outstandingResponse = await fetch('/api/print-requests', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (!outstandingResponse.ok) {
          throw new Error(`Failed to fetch outstanding requests: ${outstandingResponse.statusText}`);
        }
        const outstandingData = await outstandingResponse.json();
        setOutstandingRequests(Array.isArray(outstandingData) ? outstandingData : []);

        // Fetch assigned requests
        const assignedResponse = await fetch(`/api/print-requests/assigned/${session.user.id}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (!assignedResponse.ok) {
          throw new Error(`Failed to fetch assigned requests: ${assignedResponse.statusText}`);
        }
        const assignedData = await assignedResponse.json();
        setAssignedRequests(Array.isArray(assignedData) ? assignedData : []);

        // Fetch available YSWS
        const availableYSWSResponse = await fetch(`/api/ysws/available/${session.user.id}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (!availableYSWSResponse.ok) {
          throw new Error(`Failed to fetch available YSWS: ${availableYSWSResponse.statusText}`);
        }
        const availableYSWSData = await availableYSWSResponse.json();
        setAvailableYSWS(Array.isArray(availableYSWSData) ? availableYSWSData : []);
      } catch (error) {
        console.error('Error fetching requests:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch requests');
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, [status, session, router]);

  const handleSelectRequest = async (requestId: string) => {
    if (!session?.user?.id) return;

    try {
      setError(null);
      const response = await fetch('/api/print-requests/assign', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          requestId,
          printerId: session.user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign request');
      }

      // Refresh the requests after assignment
      const outstandingResponse = await fetch('/api/print-requests', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const outstandingData = await outstandingResponse.json();
      setOutstandingRequests(Array.isArray(outstandingData) ? outstandingData : []);

      const assignedResponse = await fetch(`/api/print-requests/assigned/${session.user.id}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const assignedData = await assignedResponse.json();
      setAssignedRequests(Array.isArray(assignedData) ? assignedData : []);

      // Refresh available YSWS after assignment
      const availableYSWSResponse = await fetch(`/api/ysws/available/${session.user.id}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const availableYSWSData = await availableYSWSResponse.json();
      setAvailableYSWS(Array.isArray(availableYSWSData) ? availableYSWSData : []);
    } catch (error) {
      console.error('Error assigning request:', error);
      setError(error instanceof Error ? error.message : 'Failed to assign request');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Print Requests</h1>

      {/* Assigned Requests */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Assigned Prints</h2>
        {assignedRequests.length === 0 ? (
          <p className="text-gray-600">No assigned prints</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {assignedRequests.map((request) => (
              <div key={request.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <PrinterIcon className="h-6 w-6 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold">Print #{request.id}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    Assigned
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <ClockIcon className="h-5 w-5 mr-2" />
                    <span>Created: {new Date(request.created_at).toLocaleDateString()}</span>
                  </div>
                  {request.deadline && (
                    <div className="flex items-center text-gray-600">
                      <ClockIcon className="h-5 w-5 mr-2" />
                      <span>Due: {new Date(request.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outstanding Requests */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Print Requests</h2>
        {outstandingRequests.length === 0 ? (
          <p className="text-gray-600">No available print requests</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {outstandingRequests.map((request) => (
              <div key={request.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <PrinterIcon className="h-6 w-6 text-indigo-600 mr-2" />
                    <h3 className="text-lg font-semibold">Print #{request.id}</h3>
                  </div>
                  <button
                    onClick={() => handleSelectRequest(request.id)}
                    className="px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                  >
                    Select
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <ClockIcon className="h-5 w-5 mr-2" />
                    <span>Created: {new Date(request.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available YSWS */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available YSWS</h2>
        {availableYSWS.length === 0 ? (
          <p className="text-gray-600">No available YSWS</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableYSWS.map((ysws) => (
              <div key={ysws} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <PrinterIcon className="h-6 w-6 text-indigo-600 mr-2" />
                    <h3 className="text-lg font-semibold">YSWS #{ysws}</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <ClockIcon className="h-5 w-5 mr-2" />
                    <span>Available</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
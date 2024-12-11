'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PrinterIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { YSWS } from '@/lib/airtable';

export default function SubmissionsPage() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace('/');
    },
  });
  const [submissions, setSubmissions] = useState<YSWS[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubmissions() {
      if (status !== 'authenticated' || !session?.user?.id) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/print-requests/assigned/${session.user.id}`);
        
        if (!response.ok) {
          if (response.status === 401) {
            router.replace('/');
            return;
          }
          throw new Error(`Failed to fetch submissions: ${response.statusText}`);
        }
        
        const data = await response.json();
        setSubmissions(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        setError(error instanceof Error ? error.message : 'Failed to load submissions');
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissions();
  }, [session?.user?.id, status]);

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
      <h1 className="text-2xl font-bold mb-6">Your Print Submissions</h1>
      {submissions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No submissions found</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {submissions.map((submission) => (
            <div key={submission.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <PrinterIcon className="h-6 w-6 text-indigo-600 mr-2" />
                  <h2 className="text-lg font-semibold">Print Request</h2>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  submission.has_been_picked 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {submission.has_been_picked ? 'Picked' : 'Pending'}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-gray-600">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  <span>Created: {new Date(submission.created_at).toLocaleDateString()}</span>
                </div>
                {submission.deadline && (
                  <div className="flex items-center text-gray-600">
                    <ClockIcon className="h-5 w-5 mr-2" />
                    <span>Deadline: {new Date(submission.deadline).toLocaleDateString()}</span>
                  </div>
                )}
                {submission.printer_id && (
                  <div className="flex items-center text-gray-600">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    <span>Printer Assigned</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
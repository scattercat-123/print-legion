'use client';
import { useState, useEffect } from 'react';

interface Job {
  id: string;
  company: string;
  position: string;
  status: 'In Progress' | 'Completed' | 'Cancelled';
  appliedDate: string;
  lastUpdated: string;
}

export default function YourJobs() {
  const [currentJobs, setCurrentJobs] = useState<Job[]>([
    {
      id: '1',
      company: 'Example-1',
      position: 'Someones Hackpad',
      status: 'In Progress',
      appliedDate: '2024-01-15',
      lastUpdated: '2024-01-20',
    },
    {
      id: '2',
      company: 'Example-2',
      position: 'Someone Elses Hackpad',
      status: 'In Progress',
      appliedDate: '2024-01-18',
      lastUpdated: '2024-01-18',
    },
  ]);

  const [pastJobs, setPastJobs] = useState<Job[]>([
    {
      id: '3',
      company: 'Example-3',
      position: 'Asylum Submission',
      status: 'Cancelled',
      appliedDate: '2023-12-01',
      lastUpdated: '2023-12-15',
    },
    {
      id: '4',
      company: 'Example-4',
      position: 'Another thing to print',
      status: 'Completed',
      appliedDate: '2023-11-20',
      lastUpdated: '2023-12-05',
    },
  ]);

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'In Progress':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'Completed':
        return 'bg-green-500/20 text-green-500';
      case 'Cancelled':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-zinc-500/20 text-zinc-500';
    }
  };

  return (
    <div className="space-y-8">
      {/* Current Jobs Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Current Jobs</h2>
        <div className="space-y-4">
          {currentJobs.map((job) => (
            <div
              key={job.id}
              className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{job.position}</h3>
                  <p className="text-zinc-400">{job.company}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-sm ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
              <div className="mt-2 text-sm text-zinc-500">
                <p>Applied: {job.appliedDate}</p>
                <p>Last Updated: {job.lastUpdated}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Past Jobs Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Past Jobs</h2>
        <div className="space-y-4">
          {pastJobs.map((job) => (
            <div
              key={job.id}
              className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors opacity-75"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{job.position}</h3>
                  <p className="text-zinc-400">{job.company}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-sm ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
              <div className="mt-2 text-sm text-zinc-500">
                <p>Applied: {job.appliedDate}</p>
                <p>Last Updated: {job.lastUpdated}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
} 
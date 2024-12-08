'use client';

import { signIn } from 'next-auth/react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const handleSignIn = () => {
  signIn('slack', { callbackUrl: '/dashboard' });
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900">Welcome to the Print Legion!</h1>
        <p className="mt-3 text-lg text-gray-500">
          Submit your 3D printing requests and manage them easily.
        </p>
        <button
          onClick={handleSignIn}
          className="mt-5 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Sign in with Slack
          <ArrowRightIcon className="ml-2 -mr-1 h-5 w-5" />
        </button>
      </div>
      <div className="mt-10">
        <iframe
          src="https://forms.hackclub.com/t/m7vamrc4mpus"
          className="w-full h-[800px] border-0"
          title="Print Request Form"
        />
      </div>
    </div>
  );
} 
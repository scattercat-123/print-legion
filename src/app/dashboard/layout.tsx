import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { getAvailableYSWS, getUser } from '@/lib/airtable';

type ChildProps = {
  initialData?: {
    available: string[];
    assigned: string[];
  };
};

export async function generateMetadata() {
  return {
    title: 'Dashboard - Print Farm',
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.slack_id) {
    return children;
  }

  const user = await getUser(session.user.slack_id);
  if (!user) {
    return children;
  }

  const availableYSWS = await getAvailableYSWS(user.slack_id);

  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement<ChildProps>(child)) {
      return React.cloneElement(child, {
        initialData: {
          available: availableYSWS,
          assigned: user.Assigned_YSWS
        }
      });
    }
    return child;
  });

  return (
    <div>
      {childrenWithProps}
    </div>
  );
} 
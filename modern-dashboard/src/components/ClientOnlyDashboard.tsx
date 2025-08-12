"use client";

import { useEffect, useState } from 'react';

interface ClientOnlyDashboardProps {
  children: React.ReactNode;
}

export function ClientOnlyDashboard({ children }: ClientOnlyDashboardProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-4 mx-auto mb-4 animate-pulse">
            <div className="h-8 w-8 bg-white rounded-sm"></div>
          </div>
          <p className="text-xl font-medium text-white">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Logo } from "@/components/logo";

// Dynamic import to prevent SSR
import dynamic from 'next/dynamic';

const DashboardContent = dynamic(() => import('@/components/DashboardContent').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="animate-pulse">
            <Logo size="lg" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Android Agent AI
          </p>
          <p className="text-lg text-gray-400">Loading Dashboard...</p>
        </div>
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  )
});

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="animate-pulse">
                <Logo size="lg" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Android Agent AI
              </p>
              <p className="text-lg text-gray-400">Initializing Dashboard...</p>
            </div>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
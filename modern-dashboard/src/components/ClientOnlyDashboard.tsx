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
      <div className="min-h-screen relative">
        {/* Tactical Camo Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-green-900/30 to-amber-800/20"></div>
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(139, 69, 19, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(85, 107, 47, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(160, 82, 45, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 60% 30%, rgba(107, 142, 35, 0.2) 0%, transparent 50%)
            `,
            backgroundSize: '400px 400px, 300px 300px, 500px 500px, 350px 350px'
          }}
        ></div>
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]"></div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="animate-pulse">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center border-2 border-amber-500/50">
                  <div className="w-8 h-8 bg-amber-400 rounded-sm"></div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-bold text-amber-400">
                TacticalOps Dashboard
              </p>
              <p className="text-lg text-amber-200/80">Loading Dashboard...</p>
            </div>
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
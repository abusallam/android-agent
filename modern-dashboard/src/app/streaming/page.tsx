/**
 * Streaming Page
 * Dedicated page for LiveKit streaming features
 */
'use client';

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StreamingDashboard } from "@/components/streaming/StreamingDashboard";
import { useAuth } from "@/contexts/AuthContext";

export default function StreamingPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <StreamingDashboard
        roomName="tactical-ops-main"
        userName={user?.username || 'User'}
        userRole={user?.role || 'USER'}
      />
    </ProtectedRoute>
  );
}
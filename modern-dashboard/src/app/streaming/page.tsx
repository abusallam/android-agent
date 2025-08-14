/**
 * Streaming Page - Placeholder
 * Temporarily disabled due to missing UI dependencies
 */
'use client';

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StreamingPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-amber-900/20 via-green-900/30 to-amber-800/20 p-6">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]"></div>
        <div className="relative z-10">
          <Card className="bg-black/80 border-amber-600/30 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-amber-400">Streaming Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-200">
                Streaming features are currently being implemented. 
                Please check back later for full LiveKit integration.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
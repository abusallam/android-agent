'use client';

import { Users, MapPin, Shield, Battery, AlertTriangle, Clock } from "lucide-react";
import Image from "next/image";

export default function Dashboard() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <Image
          src="/background.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-gray-900/85 to-slate-800/90"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-blue-500/10"></div>
      </div>
      {/* Header */}
      <header className="bg-black/90 backdrop-blur-sm shadow-lg border-b border-orange-500/30 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-lg overflow-hidden shadow-lg">
                <Image
                  src="/logo.png"
                  alt="Android Agent AI Logo"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <h1 className="ml-3 text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Android Agent AI
              </h1>
              <div className="ml-2 px-2 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-400/30 hidden sm:block">
                <span className="text-xs font-medium text-blue-300">INTELLIGENCE</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-400">Live Monitoring</span>
              </div>
              <span className="hidden sm:inline text-sm text-gray-400">Welcome, Admin</span>
              <div className="h-8 w-8 bg-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Intelligence Status */}
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-300">
                🧠 AI Intelligence System Active
              </h3>
              <p className="text-sm text-blue-400 mt-1">
                Advanced monitoring with behavioral analysis, predictive alerts, and smart automation enabled.
              </p>
            </div>
            <div className="ml-auto flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-300">AI Processing</span>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-orange-500/20">
            <div className="flex items-center">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Users className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Connected Devices</p>
                <p className="text-2xl font-bold text-white">3/10</p>
                <p className="text-xs text-green-400">+2 today</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-orange-500/20">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">GPS Tracking</p>
                <p className="text-2xl font-bold text-white">Live</p>
                <p className="text-xs text-blue-400">±5m accuracy</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-orange-500/20">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Battery className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Avg Battery</p>
                <p className="text-2xl font-bold text-white">78%</p>
                <p className="text-xs text-yellow-400">Charging: 2</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-orange-500/20">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Shield className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Network Status</p>
                <p className="text-2xl font-bold text-white">4G/WiFi</p>
                <p className="text-xs text-purple-400">Strong signal</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-orange-500/20">
            <div className="flex items-center">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Active Alerts</p>
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-xs text-green-400">All secure</p>
              </div>
            </div>
          </div>
        </div>

        {/* LiveKit Streaming Panel */}
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">📹 Live Streaming & Communication</h2>
          <p className="text-gray-300 mb-4">Real-time video, audio, and screen sharing with LiveKit WebRTC</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors">
              📹 Start Video
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors">
              🎤 Start Audio
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors">
              🖥️ Share Screen
            </button>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors">
              📞 Emergency Call
            </button>
          </div>
          <div className="bg-black/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">LiveKit WebRTC Ready</span>
            </div>
            <p className="text-xs text-gray-400">Camera, microphone, and screen sharing capabilities detected</p>
          </div>
        </div>

        {/* API Testing Panel */}
        <div className="bg-white/10 backdrop-blur-sm border border-orange-500/20 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">🧪 System Testing</h2>
          <p className="text-gray-300 mb-4">Test API endpoints and system functionality</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <a 
              href="/api/health"
              target="_blank"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block text-center"
            >
              🏥 Health Check
            </a>
            <a 
              href="/api/sync"
              target="_blank"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block text-center"
            >
              🔄 Sync API
            </a>
            <a 
              href="/api/device/sync"
              target="_blank"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block text-center"
            >
              📱 Device API
            </a>
            <a 
              href="/api/emergency/alert"
              target="_blank"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block text-center"
            >
              🚨 Emergency API
            </a>
            <a 
              href="/api/livekit/token"
              target="_blank"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block text-center"
            >
              🎥 LiveKit Token
            </a>
          </div>
        </div>

        {/* PWA Installation & Auto-Start Setup */}
        <div className="bg-white/10 backdrop-blur-sm border border-orange-500/20 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">📱 PWA Installation</h2>
          <p className="text-gray-300 mb-4">Install as PWA for background monitoring and offline access</p>
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Install App
          </button>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Interactive Map - Takes 2 columns */}
          <div className="xl:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg border border-orange-500/20 overflow-hidden">
              <div className="p-4 border-b border-orange-500/20">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <MapPin className="h-5 w-5 text-blue-400 mr-2" />
                  Live Location Tracking
                </h2>
              </div>
              <div className="h-96 bg-gradient-to-br from-blue-900/20 to-green-900/20 relative overflow-hidden flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                  <p className="text-white text-lg font-medium">Interactive Map</p>
                  <p className="text-gray-400 text-sm">Real-time device tracking</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Emergency Panel - Takes 1 column */}
          <div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg border border-orange-500/20">
              <div className="p-4 border-b border-orange-500/20">
                <h2 className="text-lg font-semibold text-white flex items-center">
                  <Shield className="h-5 w-5 text-red-400 mr-2" />
                  Emergency Center
                </h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-green-400 mx-auto mb-2" />
                  <p className="text-white text-sm font-medium">All Secure</p>
                  <p className="text-gray-400 text-xs">No active alerts</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                    <AlertTriangle className="h-4 w-4 mr-2 inline" />
                    Panic Alert
                  </button>
                  <button className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                    <MapPin className="h-4 w-4 mr-2 inline" />
                    Find Device
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Device Status Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Device Status Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg border border-orange-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Child&apos;s Phone</h3>
                  <p className="text-sm text-gray-400">Samsung Galaxy A54</p>
                </div>
              </div>
              <Shield className="h-8 w-8 text-blue-400" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Battery className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-white">85%</p>
                  <p className="text-xs text-gray-400">Battery</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-end space-x-0.5">
                  <div className="w-1 bg-green-500 h-2"></div>
                  <div className="w-1 bg-green-500 h-3"></div>
                  <div className="w-1 bg-green-500 h-4"></div>
                  <div className="w-1 bg-green-500 h-5"></div>
                  <div className="w-1 bg-gray-600 h-6"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">WiFi</p>
                  <p className="text-xs text-gray-400">Signal</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-white">Current Location</span>
              </div>
              <p className="text-sm text-gray-300">Alexandria, Egypt</p>
              <p className="text-xs text-gray-400 mt-1">31.2001, 29.9187</p>
            </div>
            
            <div className="flex space-x-2">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                Locate Device
              </button>
              <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                Send Alert
              </button>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg border border-orange-500/20">
            <div className="p-4 border-b border-orange-500/20">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <Clock className="h-5 w-5 text-blue-400 mr-2" />
                Recent Activity
              </h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Location updated</p>
                    <p className="text-xs text-gray-400">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Device status sync</p>
                    <p className="text-xs text-gray-400">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Auto-start enabled</p>
                    <p className="text-xs text-gray-400">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Background monitoring started</p>
                    <p className="text-xs text-gray-400">1 hour ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
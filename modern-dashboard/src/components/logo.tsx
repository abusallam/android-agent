"use client";

import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <Image
        src="/logo.webp"
        alt="Android Agent AI"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}

export function LogoWithText({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const subtextSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-lg opacity-30 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 p-2 rounded-xl shadow-lg">
          <Logo size={size} />
        </div>
      </div>
      <div>
        <h1 className={`${textSizes[size]} font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent`}>
          Android Agent AI
        </h1>
        <p className={`${subtextSizes[size]} text-blue-300/80 font-medium tracking-wide`}>
          Enterprise Security Platform
        </p>
      </div>
    </div>
  );
}
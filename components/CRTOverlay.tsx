'use client';

import React from 'react';

export const CRTOverlay: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Scanlines */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.3) 2px, rgba(0, 0, 0, 0.3) 4px)',
          backgroundSize: '100% 4px',
        }}
      />
      
      {/* Subtle flicker animation */}
      <div 
        className="absolute inset-0 opacity-[0.02] animate-pulse"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(200, 196, 184, 0.1) 0%, transparent 70%)',
        }}
      />
      
      {/* Vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(26, 26, 24, 0.4) 100%)',
        }}
      />
      
      {/* Screen curvature subtle shadow */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          boxShadow: 'inset 0 0 80px rgba(0, 0, 0, 0.5)',
        }}
      />
      
      {/* Phosphor glow tint */}
      <div 
        className="absolute inset-0 opacity-[0.015] mix-blend-screen"
        style={{
          background: 'rgba(90, 124, 90, 0.3)',
        }}
      />
    </div>
  );
};
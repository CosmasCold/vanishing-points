'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGeigerCounter } from '@/hooks/useGeigerCounter'; // Updated to use the absolute path alias pointing to /hooks
import { colors, typography, microform } from '@/styles/theme';
import { Activity, AlertTriangle } from 'lucide-react';

interface GeigerHUDProps {
  onClose?: () => void;
}

export const GeigerHUD: React.FC<GeigerHUDProps> = ({ onClose }) => {
  const { isActive, currentCpm, uSvh, start, stop } = useGeigerCounter();

  // Auto-boot geiger simulation loop on mounting
  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  // Determine hazard level colors based on radiation threshold limits
  const isHighRadiation = currentCpm > 350;
  const isCriticalRadiation = currentCpm > 1200;

  const hazardColor = isCriticalRadiation
    ? colors.archive.red
    : isHighRadiation
    ? colors.archive.amber
    : microform.halogen || '#ffaa55';

  return (
    <div
      className="p-4 border rounded-[2px] w-64 select-none relative"
      style={{
        borderColor: colors.archive.grayDark || '#2a2a28',
        backgroundColor: 'rgba(10, 8, 6, 0.96)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.8), inset 0 0 16px rgba(0,0,0,0.9)',
      }}
    >
      {/* Small top header panel */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-1.5">
          <Activity
            size={11}
            className={isActive ? 'animate-pulse' : ''}
            style={{ color: hazardColor }}
          />
          <span
            style={{
              fontFamily: typography.mono,
              fontSize: '8.5px',
              letterSpacing: '0.12em',
              color: colors.archive.grayLight || '#a4a29b',
            }}
          >
            RADIOMETRIC SENSOR // ANM-2B
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[9px] font-mono opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: colors.archive.gray }}
          >
            ×
          </button>
        )}
      </div>

      {/* Main Nixie display grid */}
      <div
        className="py-3 px-4 mb-3 border relative overflow-hidden flex items-baseline justify-between"
        style={{
          backgroundColor: '#070503',
          borderColor: 'rgba(26, 17, 10, 0.6)',
        }}
      >
        {/* Glow backdrop simulation */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10 transition-colors duration-500"
          style={{
            background: `radial-gradient(circle at center, ${hazardColor} 0%, transparent 80%)`,
          }}
        />

        <div className="flex flex-col z-10">
          <span
            style={{
              fontFamily: typography.mono,
              fontSize: '28px',
              fontWeight: 'bold',
              lineHeight: 1,
              color: hazardColor,
              textShadow: `0 0 10px ${hazardColor}80, 0 0 20px ${hazardColor}20`,
            }}
          >
            {currentCpm.toString().padStart(4, '0')}
          </span>
          <span
            style={{
              fontFamily: typography.mono,
              fontSize: '7.5px',
              letterSpacing: '0.08em',
              color: colors.archive.gray || '#7a7870',
              marginTop: '4px',
            }}
          >
            COUNTS / MINUTE (CPM)
          </span>
        </div>

        {/* Hazard LED Flasher */}
        <div className="flex flex-col items-end justify-between h-full z-10">
          <AnimatePresence mode="popLayout">
            {isActive && (
              <motion.div
                key={`led-${currentCpm}`} // Flash LED on every numeric change tick
                initial={{ opacity: 1, scale: 1.25 }}
                animate={{ opacity: 0.3, scale: 1 }}
                transition={{ duration: 0.12 }}
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: hazardColor,
                  boxShadow: `0 0 12px ${hazardColor}, 0 0 4px ${hazardColor}`,
                }}
              />
            )}
          </AnimatePresence>
          {isHighRadiation && (
            <div className="flex items-center gap-1 mt-6 animate-pulse">
              <AlertTriangle size={10} style={{ color: colors.archive.red }} />
              <span
                style={{
                  fontFamily: typography.mono,
                  fontSize: '7px',
                  color: colors.archive.red,
                  fontWeight: 'bold',
                }}
              >
                HOT ZONE
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Auxiliary micro dosage display */}
      <div
        className="flex justify-between items-center px-1 font-mono text-[9px]"
        style={{ color: colors.archive.grayLight }}
      >
        <div className="flex flex-col">
          <span style={{ fontSize: '7px', opacity: 0.5, letterSpacing: '0.05em' }}>OBSERVER DOSE</span>
          <span style={{ color: hazardColor, fontWeight: 'medium' }}>
            {uSvh.toFixed(3)} µSv/h
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span style={{ fontSize: '7px', opacity: 0.5, letterSpacing: '0.05em' }}>STATUS GAUGE</span>
          <span style={{ color: colors.archive.green }}>
            {isCriticalRadiation ? 'OVERLOAD' : isHighRadiation ? 'DEGRADED' : 'CALIBRATED'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GeigerHUD;

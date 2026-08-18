'use client';
import React from 'react';
import { ARCHIVE_ENVIRONMENTS } from '@/lib/archive/environments';
import type { ArchiveStation } from '@/lib/archive/stations';

export type ArchiveEnvironmentStation = ArchiveStation;

export interface ArchiveEnvironmentProps { station?: ArchiveEnvironmentStation; className?: string; }

export const ArchiveEnvironment: React.FC<ArchiveEnvironmentProps> = ({ station = 'evidence', className = '' }) => {
  const env = ARCHIVE_ENVIRONMENTS[station];
  const background = env.background ?? '/images/desktop-final.png';
  return <div className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`} data-archive-station={station} data-archive-treatment={env.treatment} aria-hidden="true">
    <div className="absolute inset-0" style={{ backgroundImage: `url('${background}')`, backgroundPosition: env.backgroundPosition, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', filter: env.treatment === 'restricted' ? 'contrast(1.12) saturate(.55) brightness(.82)' : env.treatment === 'technical' ? 'contrast(1.08) saturate(.72) brightness(.94)' : env.treatment === 'anomalous' ? 'contrast(1.08) saturate(.62) brightness(.88)' : 'contrast(1.06) saturate(.78) brightness(.98) sepia(.025)' }} />
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,214,150,.018), transparent 30%, rgba(0,0,0,.045) 100%), linear-gradient(90deg, rgba(0,0,0,.025), transparent 18%, transparent 82%, rgba(0,0,0,.035))' }} />
    <div className="absolute inset-0 opacity-[0.025] mix-blend-screen" style={{ backgroundImage: 'radial-gradient(circle at 12% 24%, rgba(255,220,170,.34) 0 1px, transparent 1.5px), radial-gradient(circle at 37% 68%, rgba(255,220,170,.20) 0 .7px, transparent 1.2px), radial-gradient(circle at 62% 31%, rgba(255,220,170,.18) 0 .8px, transparent 1.3px), radial-gradient(circle at 82% 73%, rgba(255,220,170,.22) 0 .7px, transparent 1.2px)' }} />
  </div>;
};

export default ArchiveEnvironment;

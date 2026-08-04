// components/archive/TopStatusBar.tsx
'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { List, Plus, BookOpen, Route, Flame } from 'lucide-react';
import Link from 'next/link';
import RandomDestination from '@/components/RandomDestination';
import { type Place } from '@/logic/gameState';

interface TopStatusBarProps {
  booted: boolean;
  visitedCount: number;
  places: Place[];
  visibleCount: number;
  onOpenLog: () => void;
  onOpenPlanner: () => void;
  onOpenLanterns: () => void;
  onOpenPlace: (place: Place) => void;
}

export const TopStatusBar = memo(function TopStatusBar({
  booted,
  visitedCount,
  places,
  visibleCount,
  onOpenLog,
  onOpenPlanner,
  onOpenLanterns,
  onOpenPlace,
}: TopStatusBarProps) {
  return (
    <header className="absolute top-0 left-0 right-0 z-40 safe-top pointer-events-none">
      <div
        className="h-px w-full"
        style={{
          background:
            'linear-gradient(90deg, transparent, #9a8a7260, transparent)',
        }}
      />

      <div className="px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: booted ? 1 : 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto"
        >
          <h1
            className="font-cinzel text-xl md:text-2xl font-medium tracking-wide"
            style={{
              color: '#ddd0bc',
              textShadow: '0 0 18px rgba(221,208,188,0.12)',
            }}
          >
            Vanishing Points
          </h1>
          <p className="font-mono text-[11px] text-[#9a8a72] mt-1 tracking-[0.2em] uppercase opacity-70">
            An atlas of the forgotten
          </p>
        </motion.div>

        <motion.nav
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: booted ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-2 md:gap-3 pointer-events-auto overflow-x-auto max-w-full pb-1 md:pb-0 no-scrollbar"
        >
          <RandomDestination places={places} onSelect={onOpenPlace} />

          <NavBtn
            onClick={onOpenLog}
            icon={<BookOpen size={14} />}
            label={`Log${visitedCount > 0 ? ` (${visitedCount})` : ''}`}
            title="Your Expedition Log (L)"
          />
          <NavBtn
            onClick={onOpenPlanner}
            icon={<Route size={14} />}
            label="Plan"
            title="Expedition Planner (E)"
          />
          <NavBtn
            onClick={onOpenLanterns}
            icon={<Flame size={14} />}
            label="Lanterns"
            title="Lantern Grid (K)"
          />
          <NavLink
            href="/list"
            icon={<List size={14} />}
            label="Archives"
            title="Archives (A)"
          />
          <NavLink
            href="/submit"
            icon={<Plus size={14} />}
            label="Witness a ruin"
            title="Document a place (S)"
            highlight
          />
        </motion.nav>
      </div>

      <div
        className="h-px w-full opacity-30"
        style={{
          background:
            'linear-gradient(90deg, transparent, #9a8a7240, transparent)',
        }}
      />
    </header>
  );
});

/* ─── Sub-components ─── */

const NavBtn = memo(function NavBtn({
  onClick,
  icon,
  label,
  title,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  title: string;
}) {
  return (
    <button
      onClick={() => {
        window.dispatchEvent(new CustomEvent('vp-ui-click'));
        onClick();
      }}
      title={title}
      className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[11px] md:text-xs transition-all duration-300 active:scale-95 flex-shrink-0"
      style={{
        color: '#9a8a72',
        background: 'rgba(18,14,10,0.65)',
        border: '1px solid rgba(122,107,82,0.18)',
        backdropFilter: 'blur(6px)',
        boxShadow:
          'inset 0 1px 0 rgba(122,107,82,0.06), 0 2px 8px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#ddd0bc';
        e.currentTarget.style.borderColor = 'rgba(154,138,114,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = '#9a8a72';
        e.currentTarget.style.borderColor = 'rgba(122,107,82,0.18)';
      }}
    >
      <span className="opacity-70">{icon}</span>
      <span className="hidden sm:inline font-mono uppercase tracking-wider">
        {label}
      </span>
    </button>
  );
});

const NavLink = memo(function NavLink({
  href,
  icon,
  label,
  title,
  highlight,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  title: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      title={title}
      className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[11px] md:text-xs transition-all duration-300 active:scale-95 flex-shrink-0"
      style={{
        color: highlight ? '#ddd0bc' : '#9a8a72',
        background: highlight
          ? 'rgba(122,107,82,0.12)'
          : 'rgba(18,14,10,0.65)',
        border: '1px solid rgba(122,107,82,0.18)',
        backdropFilter: 'blur(6px)',
        boxShadow:
          'inset 0 1px 0 rgba(122,107,82,0.06), 0 2px 8px rgba(0,0,0,0.3)',
      }}
      onClick={() => {
        window.dispatchEvent(new CustomEvent('vp-ui-click'));
      }}
      onMouseEnter={(e) => {
        window.dispatchEvent(new CustomEvent('vp-ui-hover'));
        e.currentTarget.style.color = '#ddd0bc';
        e.currentTarget.style.borderColor = 'rgba(154,138,114,0.4)';
        if (highlight)
          e.currentTarget.style.background = 'rgba(122,107,82,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = highlight ? '#ddd0bc' : '#9a8a72';
        e.currentTarget.style.borderColor = 'rgba(122,107,82,0.18)';
        if (highlight)
          e.currentTarget.style.background = 'rgba(122,107,82,0.12)';
      }}
    >
      <span className="opacity-70">{icon}</span>
      <span className="hidden sm:inline font-mono uppercase tracking-wider">
        {label}
      </span>
    </Link>
  );
});
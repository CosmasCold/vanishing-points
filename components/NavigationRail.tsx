'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Map, 
  FolderSearch, 
  Paperclip, 
  Radio, 
  FileText, 
  BookOpen, 
  Package, 
  Lightbulb,
  Settings
} from 'lucide-react';
import { useUIStore } from '@/state/uiStore';
import { useAudioStore } from '@/state/audioStore';
import { ModuleId } from '@/types';
import { colors, typography, spacing } from '@/styles/theme';

interface NavItem {
  id: ModuleId;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'inbox', label: 'INBOX', icon: Mail, badge: 2 },
  { id: 'atlas', label: 'ATLAS', icon: Map },
  { id: 'investigations', label: 'CASES', icon: FolderSearch, badge: 3 },
  { id: 'evidence', label: 'EVIDENCE', icon: Paperclip },
  { id: 'signals', label: 'SIGNALS', icon: Radio },
  { id: 'documents', label: 'DOCS', icon: FileText },
  { id: 'research', label: 'RESEARCH', icon: BookOpen },
  { id: 'inventory', label: 'INV', icon: Package },
  { id: 'discoveries', label: 'FINDS', icon: Lightbulb },
  { id: 'system', label: 'SYS', icon: Settings },
];

export const NavigationRail: React.FC = () => {
  const { activeModule, setActiveModule, terminalOpen } = useUIStore();
  const { click } = useAudioStore();
  
  const handleClick = (id: ModuleId) => {
    click();
    setActiveModule(activeModule === id ? null : id);
  };
  
  return (
    <div 
      className="fixed left-0 top-0 bottom-0 z-20 flex flex-col border-r"
      style={{ 
        width: spacing.rail,
        backgroundColor: colors.archive.surface,
        borderColor: colors.archive.gray,
        paddingTop: '2.5rem',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = activeModule === item.id;
        const Icon = item.icon;
        
        return (
          <motion.button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className="relative flex flex-col items-center justify-center py-3 group"
            whileTap={{ scale: 0.95 }}
          >
            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="activeModule"
                className="absolute left-0 top-0 bottom-0 w-px"
                style={{ backgroundColor: colors.archive.amber }}
                transition={{ duration: 0.2 }}
              />
            )}
            
            <div className="relative">
              <Icon 
                size={18} 
                style={{ 
                  color: isActive ? colors.archive.amber : colors.archive.grayLight,
                }}
              />
              {item.badge && (
                <div 
                  className="absolute -top-1 -right-1 flex items-center justify-center min-w-[14px] h-[14px] px-1 text-[9px]"
                  style={{ 
                    backgroundColor: colors.archive.red,
                    color: colors.archive.white,
                    fontFamily: typography.mono,
                  }}
                >
                  {item.badge}
                </div>
              )}
            </div>
            
            <span
              className="mt-1 tracking-wider"
              style={{
                color: isActive ? colors.archive.amber : colors.archive.gray,
                fontFamily: typography.mono,
                fontSize: '0.625rem',
              }}
            >
              {item.label}
            </span>
          </motion.button>
        );
      })}
      
      {/* Terminal toggle at bottom */}
      <div className="flex-1" />
      <button
        onClick={() => {
          click();
          useUIStore.getState().toggleTerminal();
        }}
        className="flex flex-col items-center justify-center py-3 border-t"
        style={{ 
          borderColor: colors.archive.gray,
          color: terminalOpen ? colors.archive.amber : colors.archive.gray,
        }}
      >
        <span style={{ 
          fontFamily: typography.mono, 
          fontSize: typography.sizes.xs 
        }}>
          &gt;_
        </span>
        <span style={{ 
          fontFamily: typography.mono, 
          fontSize: '0.625rem',
          color: terminalOpen ? colors.archive.amber : colors.archive.gray,
        }}>
          TERM
        </span>
      </button>
    </div>
  );
};
'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/state/uiStore';
import { useTerminalStore } from '@/state/terminalStore';
import { useInvestigationStore } from '@/state/investigationStore';
import { useDocumentStore } from '@/state/documentStore';
import { useArtifactStore } from '@/state/artifactStore';
import { useMediaStore } from '@/state/mediaStore';

const MODULE_KEYS: Record<string, string> = {
  '1': 'inbox',
  '2': 'atlas',
  '3': 'investigations',
  '4': 'evidence',
  '5': 'signals',
  '6': 'documents',
  '7': 'research',
  '8': 'inventory',
  '9': 'discoveries',
  '0': 'system',
};

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { terminalOpen, setTerminalOpen, setActiveModule, activeModule } = useUIStore.getState();
      const { activeInvestigationId, closeInvestigation } = useInvestigationStore.getState();
      const { activeDocument, closeDocument } = useDocumentStore.getState();
      const { activeArtifact, closeArtifact } = useArtifactStore.getState();
      const { activeMedia, closeMedia } = useMediaStore.getState();

      // Close overlays with ESC (priority)
      if (e.key === 'Escape') {
        if (activeMedia) { closeMedia(); return; }
        if (activeDocument) { closeDocument(); return; }
        if (activeArtifact) { closeArtifact(); return; }
        if (activeInvestigationId) { closeInvestigation(); return; }
        if (terminalOpen) { setTerminalOpen(false); return; }
        return;
      }

      // Terminal toggle: backtick or tilde
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        setTerminalOpen(!terminalOpen);
        return;
      }

      // Ignore shortcuts when typing in inputs or overlays are open
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        activeMedia ||
        activeDocument ||
        activeArtifact
      ) {
        return;
      }

      // Module switching (number keys)
      if (!terminalOpen && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const moduleId = MODULE_KEYS[e.key];
        if (moduleId) {
          e.preventDefault();
          setActiveModule(activeModule === moduleId ? null : moduleId);
          return;
        }
      }

      // Help
      if (e.key === '?' && !terminalOpen) {
        e.preventDefault();
        const { addCommand } = useTerminalStore.getState();
        addCommand({
          id: `help-${Date.now()}`,
          input: 'help',
          output: `KEYBOARD SHORTCUTS\n══════════════════\n\`        Toggle terminal\n1-9,0    Toggle modules\n?        Show this help\nESC      Close overlay / terminal\n\nType 'help' in terminal for command list.`,
          timestamp: Date.now(),
          type: 'system',
        });
        setTerminalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
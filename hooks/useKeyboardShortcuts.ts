import { useEffect, useCallback } from 'react';
import { useUIStore } from '@/state/uiStore';
import { useSessionStore } from '@/state/sessionStore';
import { useAudioStore } from '@/state/audioStore';
import { ModuleId } from '@/types';

const HOTKEY_MAP: Record<string, ModuleId> = {
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
  const { activeModule, setActiveModule, setTerminalOpen, terminalOpen } = useUIStore();
  const { ritualComplete } = useSessionStore();
  const { click } = useAudioStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 1. Backtick terminal toggling remains active for emergencies
    if (e.key === '`' || e.key === '~') {
      e.preventDefault();
      click();
      setTerminalOpen(!terminalOpen);
      return;
    }

    // 2. Prevent shortcut routing when terminal is focused or during text inputs
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable || 
      terminalOpen
    ) {
      return;
    }

    // 3. SECURE PROGRESSION GATE: Block module switching before Daily Ritual sync completes
    if (!ritualComplete) {
      // Shhh... the terminal is still synchronizing. No shortcuts allowed.
      return;
    }

    // 4. Run module switching
    const targetModule = HOTKEY_MAP[e.key];
    if (targetModule) {
      e.preventDefault();
      click();
      setActiveModule(targetModule);
    }
  }, [terminalOpen, setTerminalOpen, ritualComplete, setActiveModule, click]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
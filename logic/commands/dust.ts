import { CommandRegistry } from '../commandRegistry';
import { useUIStore, DUST_THRESHOLDS, STABILITY_THRESHOLDS } from '@/state/uiStore';
import { useInvestigationStore } from '@/state/investigationStore';

function getDustLabel(dust: number): string {
  if (dust >= DUST_THRESHOLDS.EXTREME) return 'EXTREME';
  if (dust >= DUST_THRESHOLDS.HIGH) return 'HIGH';
  if (dust >= DUST_THRESHOLDS.MODERATE) return 'MODERATE';
  if (dust >= DUST_THRESHOLDS.LOW) return 'LOW';
  return 'NOMINAL';
}

function getStabilityLabel(stab: number): string {
  if (stab <= STABILITY_THRESHOLDS.UNSTABLE) return 'UNSTABLE';
  if (stab <= STABILITY_THRESHOLDS.CRITICAL) return 'CRITICAL';
  if (stab <= STABILITY_THRESHOLDS.DEGRADED) return 'DEGRADED';
  if (stab <= STABILITY_THRESHOLDS.NOMINAL) return 'NOMINAL';
  return 'OPTIMAL';
}

export function registerDustCommands(registry: CommandRegistry) {
  registry.register({
    name: 'status',
    description: 'Display Dust index and Observer Stability',
    usage: 'status',
    aliases: ['dust', 'stability', 'observer'],
    handler: () => {
      const { status } = useUIStore.getState();
      const dustLabel = getDustLabel(status.dustIndex);
      const stabLabel = getStabilityLabel(status.observerStability);

      let output = 'OBSERVER STATUS REPORT\n';
      output += '══════════════════════\n\n';
      output += `Dust Index:        ${status.dustIndex}\n`;
      output += `Classification:    ${dustLabel}\n\n`;
      output += `Observer Stability: ${status.observerStability.toFixed(1)}%\n`;
      output += `Classification:    ${stabLabel}\n\n`;

      if (status.dustIndex >= DUST_THRESHOLDS.EXTREME) {
        output += 'WARNING: Reality consensus compromised.\nMultiple valid histories detected.\nArchive integrity uncertain.\n';
      } else if (status.dustIndex >= DUST_THRESHOLDS.HIGH) {
        output += 'CAUTION: Document drift likely.\nVerify all evidence against preserved originals.\n';
      } else if (status.dustIndex >= DUST_THRESHOLDS.MODERATE) {
        output += 'NOTICE: Perception filters degrading.\nMinor anomalies expected.\n';
      }

      if (status.observerStability <= STABILITY_THRESHOLDS.UNSTABLE) {
        output += '\nCRITICAL: Observer identity uncertain.\nRecommend immediate grounding procedure.\n';
      } else if (status.observerStability <= STABILITY_THRESHOLDS.CRITICAL) {
        output += '\nWARNING: Memory reliability compromised.\nDo not trust uncorroborated observations.\n';
      }

      return { output, type: 'info' as const };
    },
  });

  registry.register({
    name: 'ground',
    description: 'Perform grounding ritual to restore Observer Stability',
    usage: 'ground',
    handler: () => {
      const result = useUIStore.getState().ground();
      if (!result.success) {
        return { output: result.message, type: 'warning' as const };
      }
      return { output: result.message, type: 'success' as const };
    },
  });

  registry.register({
    name: 'catalogue',
    description: 'Organize evidence to restore stability',
    usage: 'catalogue',
    handler: () => {
      const result = useUIStore.getState().catalogue();
      if (!result.success) {
        return { output: result.message, type: 'warning' as const };
      }
      return { output: result.message, type: 'success' as const };
    },
  });

  registry.register({
    name: 'review',
    description: 'Review verified evidence to anchor memory',
    usage: 'review',
    handler: () => {
      const { evidence } = useInvestigationStore.getState();
      const allEvidence = Object.values(evidence).flat();
      const verified = allEvidence.filter((e) => e.status === 'analyzed').length;

      if (verified === 0) {
        return { output: 'No verified evidence available for review.', type: 'warning' as const };
      }

      const restore = Math.min(verified * 2, 15);
      useUIStore.getState().restoreStability(restore);

      return {
        output: `Reviewed ${verified} verified items.\nObserver Stability restored by ${restore}.\nMemory anchors reinforced.`,
        type: 'success' as const,
      };
    },
  });
}
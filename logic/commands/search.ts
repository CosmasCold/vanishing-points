import { CommandRegistry, CommandResult } from '../commandRegistry';
import { LOCAL_PLACES } from '@/data/places';
import { SEED_DOCUMENTS } from '@/data/seedDocuments';

export function registerSearchCommands(registry: CommandRegistry) {
  registry.register({
    name: 'search',
    description: 'Query the Archive index using advanced operators and filters',
    usage: 'search <query> [--before <year>] [--status <status>] [--modified-by <author>] [--deleted]',
    aliases: ['query', 'find', 'locate-file'],
    handler: async (args: string[]): Promise<CommandResult> => {
      // 1. Handle special --deleted flag (Case Zero pays off)
      if (args.includes('--deleted')) {
        return {
          output: `RESULTS: 1 FOUND.
------------------------------------------------
CASE NO. 000: YOURSELF
STATUS: ACTIVE / PRESENT
DATE: 1962-03-15 (INITIALIZED) -> 2026-08-09 (ACTIVE SESSION)
AUTHORIZATION: INV_RED-7
LOCATION: TERMINAL DESK COCKPIT
RESONANCE: "The previous investigator did not retire. They are sitting in your chair. They are writing this query."
------------------------------------------------
[BUNKER_7: The system has completed its loop. You are looking at the mirror of the database. You have always been Case Zero.]`,
          type: 'warning'
        };
      }

      // Parse query and flags
      const queryWords: string[] = [];
      let beforeYear: number | null = null;
      let targetStatus: string | null = null;
      let targetAuthor: string | null = null;

      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--before' && i + 1 < args.length) {
          beforeYear = parseInt(args[i + 1]);
          i++;
        } else if (args[i] === '--status' && i + 1 < args.length) {
          targetStatus = args[i + 1].toLowerCase();
          i++;
        } else if (args[i] === '--modified-by' && i + 1 < args.length) {
          targetAuthor = args[i + 1].toLowerCase();
          i++;
        } else {
          queryWords.push(args[i].toLowerCase());
        }
      }

      const query = queryWords.join(' ').trim();

      // Ensure at least one search criterion is specified
      if (!query && beforeYear === null && !targetStatus && !targetAuthor) {
        return {
          output: 'SEARCH REJECTED: Empty parameters. Please state your search query or specify a flag.\nUsage: search <query> [--before <year>] [--status <status>] [--modified-by <author>]',
          type: 'error'
        };
      }

      const matchedPlaces = LOCAL_PLACES.filter((place) => {
        // Match query string
        if (query) {
          const matchQuery =
            place.name.toLowerCase().includes(query) ||
            place.history.toLowerCase().includes(query) ||
            place.slug.toLowerCase().includes(query) ||
            (place.resonanceNote && place.resonanceNote.toLowerCase().includes(query));
          if (!matchQuery) return false;
        }

        // Match --before flag
        if (beforeYear !== null) {
          if (!place.yearAbandoned || place.yearAbandoned > beforeYear) return false;
        }

        // Match --status flag
        if (targetStatus) {
          if (!place.status || place.status.toLowerCase() !== targetStatus) return false;
        }

        return true;
      });

      const matchedDocs = SEED_DOCUMENTS.filter((doc) => {
        // Skip document if we are filtering specifically by Place status or year
        if (targetStatus || beforeYear !== null) return false;

        // Match query string
        if (query) {
          const matchQuery =
            doc.title.toLowerCase().includes(query) ||
            doc.content.toLowerCase().includes(query) ||
            doc.slug.toLowerCase().includes(query) ||
            doc.id.toLowerCase().includes(query);
          if (!matchQuery) return false;
        }

        // Match --modified-by flag
        if (targetAuthor) {
          const authorMatch =
            doc.author.toLowerCase().includes(targetAuthor) ||
            (doc.id === 'doc-arch-1962-001' && targetAuthor === 'inv_red-7');
          if (!authorMatch) return false;
        }

        return true;
      });

      // Format results output
      let output = `SEARCH RESULTS FOR: "${args.join(' ')}"\n`;
      output += `================================================\n`;
      
      const totalResults = matchedPlaces.length + matchedDocs.length;
      if (totalResults === 0) {
        return {
          output: `SEARCH RESULT: 0 RECORDS FOUND.\n------------------------------------------------\nBUNKER_7: The Archive shows nothing. Either the information is sealed, or it has already been forgotten. Check your spelling or filters.`,
          type: 'warning'
        };
      }

      if (matchedPlaces.length > 0) {
        output += `\n--- GEODETIC PLACES FOUND (${matchedPlaces.length}) ---\n`;
        matchedPlaces.forEach((p) => {
          output += `[PLACE] ${p.name.toUpperCase()} (${p.slug})\n`;
          output += `  Status: ${p.status.toUpperCase()} | Danger: D${p.dangerLevel} | Year: ${p.yearAbandoned || 'Unknown'}\n`;
          if (p.resonanceNote) {
            output += `  Resonance: "${p.resonanceNote}"\n`;
          }
          output += `\n`;
        });
      }

      if (matchedDocs.length > 0) {
        output += `\n--- DECLASSIFIED DOSSIERS FOUND (${matchedDocs.length}) ---\n`;
        matchedDocs.forEach((d) => {
          output += `[DOCUMENT] ${d.title}\n`;
          output += `  ID: ${d.id} | Author: ${d.author} | Date: ${d.date}\n`;
          output += `  Excerpt: "${d.content.substring(0, 100)}..."\n\n`;
        });
      }

      output += `================================================\n`;
      output += `TOTAL RESULTS ACQUIRED: ${totalResults} RECORD(S).`;

      return {
        output,
        type: 'success'
      };
    }
  });
}

import {
  CommandRegistry,
  CommandResult,
} from '../commandRegistry';

import { LOCAL_PLACES } from '@/data/places';
import { SEED_DOCUMENTS } from '@/data/seedDocuments';
import { useProgressionStore } from '@/state/progressionStore';

export function registerSearchCommands(
  registry: CommandRegistry,
) {
  registry.register({
    name: 'search',

    description:
      'Query the Archive index using advanced operators and filters',

    usage:
      'search <query> [--before <year>] [--status <status>] [--modified-by <author>] [--deleted]',

    aliases: [
      'query',
      'find',
      'locate-file',
    ],

    handler: async (
      args: string[],
    ): Promise<CommandResult> => {
      // -----------------------------------------------------------------------
      // CASE ZERO / DELETED RECORDS
      //
      // This remains an authored late-game search result. It is deliberately
      // not part of the ordinary document corpus search.
      // -----------------------------------------------------------------------

      if (args.includes('--deleted')) {
        return {
          output:
            `RESULTS: 1 FOUND.
------------------------------------------------
CASE NO. 000: YOURSELF
STATUS: ACTIVE / PRESENT
DATE: 1962-03-15 (INITIALIZED) -> 2026-08-09 (ACTIVE SESSION)
AUTHORIZATION: INV_RED-7
LOCATION: TERMINAL DESK COCKPIT
RESONANCE: "The previous investigator did not retire. They are sitting in your chair. They are writing this query."
------------------------------------------------
[BUNKER_7: The system has completed its loop. You are looking at the mirror of the database. You have always been Case Zero.]`,

          type: 'warning',
        };
      }

      // -----------------------------------------------------------------------
      // CANONICAL PROGRESSION
      //
      // Search is an investigation interface, so it must obey the same
      // document discovery authority as the graphical Archive and /examine.
      // -----------------------------------------------------------------------

      const {
        discoveredDocumentIds,
      } =
        useProgressionStore.getState();

      // -----------------------------------------------------------------------
      // PARSE QUERY AND FLAGS
      // -----------------------------------------------------------------------

      const queryWords: string[] = [];

      let beforeYear:
        number | null = null;

      let targetStatus:
        string | null = null;

      let targetAuthor:
        string | null = null;

      for (
        let i = 0;
        i < args.length;
        i++
      ) {
        if (
          args[i] === '--before' &&
          i + 1 < args.length
        ) {
          beforeYear =
            parseInt(
              args[i + 1],
              10,
            );

          i++;
        } else if (
          args[i] === '--status' &&
          i + 1 < args.length
        ) {
          targetStatus =
            args[i + 1].toLowerCase();

          i++;
        } else if (
          args[i] === '--modified-by' &&
          i + 1 < args.length
        ) {
          targetAuthor =
            args[i + 1].toLowerCase();

          i++;
        } else {
          queryWords.push(
            args[i].toLowerCase(),
          );
        }
      }

      const query =
        queryWords
          .join(' ')
          .trim();

      // -----------------------------------------------------------------------
      // VALIDATION
      // -----------------------------------------------------------------------

      if (
        !query &&
        beforeYear === null &&
        !targetStatus &&
        !targetAuthor
      ) {
        return {
          output:
            'SEARCH REJECTED: Empty parameters. Please state your search query or specify a flag.\n' +
            'Usage: search <query> [--before <year>] [--status <status>] [--modified-by <author>]',
          type: 'error',
        };
      }

      // -----------------------------------------------------------------------
      // PLACE SEARCH
      //
      // Places retain their existing search behavior.
      // This change only closes the document discovery bypass.
      // -----------------------------------------------------------------------

      const matchedPlaces =
        LOCAL_PLACES.filter(
          (place) => {
            // Match query string.
            if (query) {
              const matchQuery =
                place.name
                  .toLowerCase()
                  .includes(query) ||
                place.history
                  .toLowerCase()
                  .includes(query) ||
                place.slug
                  .toLowerCase()
                  .includes(query) ||
                (
                  place.resonanceNote &&
                  place.resonanceNote
                    .toLowerCase()
                    .includes(query)
                );

              if (!matchQuery) {
                return false;
              }
            }

            // Match --before flag.
            if (
              beforeYear !== null
            ) {
              if (
                !place.yearAbandoned ||
                place.yearAbandoned >
                  beforeYear
              ) {
                return false;
              }
            }

            // Match --status flag.
            if (targetStatus) {
              if (
                !place.status ||
                place.status
                  .toLowerCase() !==
                  targetStatus
              ) {
                return false;
              }
            }

            return true;
          },
        );

      // -----------------------------------------------------------------------
      // DOCUMENT SEARCH
      //
      // IMPORTANT:
      // The authored corpus remains immutable.
      //
      // Discovery is a separate canonical progression concern. A document
      // can exist in SEED_DOCUMENTS without being available to the player.
      //
      // Personnel File 447 is the first explicit example:
      //
      //   authored corpus
      //          ↓
      //   Session 3 progression
      //          ↓
      //   discoveredDocumentIds
      //          ↓
      //   searchable
      //
      // This keeps Search, Archive, and /examine on the same progression gate.
      // -----------------------------------------------------------------------

      const matchedDocs =
        SEED_DOCUMENTS.filter(
          (doc) => {
            /*
             * Personnel File 447 is a Session 3 provenance artifact.
             *
             * Do not allow search to reveal it before canonical discovery.
             */
            if (
              doc.id ===
                'personnel-447' &&
              !discoveredDocumentIds.includes(
                'personnel-447',
              )
            ) {
              return false;
            }

            /*
             * Existing search semantics:
             * document searches are skipped when place-specific
             * status/year filters are active.
             */
            if (
              targetStatus ||
              beforeYear !== null
            ) {
              return false;
            }

            // Match query string.
            if (query) {
              const matchQuery =
                doc.title
                  .toLowerCase()
                  .includes(query) ||
                doc.content
                  .toLowerCase()
                  .includes(query) ||
                doc.slug
                  .toLowerCase()
                  .includes(query) ||
                doc.id
                  .toLowerCase()
                  .includes(query);

              if (!matchQuery) {
                return false;
              }
            }

            // Match --modified-by flag.
            if (targetAuthor) {
              const authorMatch =
                doc.author
                  .toLowerCase()
                  .includes(
                    targetAuthor,
                  ) ||
                (
                  doc.id ===
                    'doc-arch-1962-001' &&
                  targetAuthor ===
                    'inv_red-7'
                );

              if (!authorMatch) {
                return false;
              }
            }

            return true;
          },
        );

      // -----------------------------------------------------------------------
      // OUTPUT
      // -----------------------------------------------------------------------

      let output =
        `SEARCH RESULTS FOR: "${args.join(' ')}"\n`;

      output +=
        `================================================\n`;

      const totalResults =
        matchedPlaces.length +
        matchedDocs.length;

      if (
        totalResults === 0
      ) {
        return {
          output:
            `SEARCH RESULT: 0 RECORDS FOUND.\n` +
            `------------------------------------------------\n` +
            `BUNKER_7: The Archive shows nothing. Either the information is sealed, or it has already been forgotten. Check your spelling or filters.`,

          type: 'warning',
        };
      }

      // -----------------------------------------------------------------------
      // PLACE RESULTS
      // -----------------------------------------------------------------------

      if (
        matchedPlaces.length >
        0
      ) {
        output +=
          `\n--- GEODETIC PLACES FOUND (${matchedPlaces.length}) ---\n`;

        matchedPlaces.forEach(
          (place) => {
            output +=
              `[PLACE] ${place.name.toUpperCase()} (${place.slug})\n`;

            output +=
              `  Status: ${place.status.toUpperCase()} | Danger: D${place.dangerLevel} | Year: ${place.yearAbandoned || 'Unknown'}\n`;

            if (
              place.resonanceNote
            ) {
              output +=
                `  Resonance: "${place.resonanceNote}"\n`;
            }

            output +=
              `\n`;
          },
        );
      }

      // -----------------------------------------------------------------------
      // DOCUMENT RESULTS
      // -----------------------------------------------------------------------

      if (
        matchedDocs.length >
        0
      ) {
        output +=
          `\n--- DECLASSIFIED DOSSIERS FOUND (${matchedDocs.length}) ---\n`;

        matchedDocs.forEach(
          (doc) => {
            output +=
              `[DOCUMENT] ${doc.title}\n`;

            output +=
              `  ID: ${doc.id} | Author: ${doc.author} | Date: ${doc.date}\n`;

            output +=
              `  Excerpt: "${doc.content.substring(0, 100)}..."\n\n`;
          },
        );
      }

      output +=
        `================================================\n`;

      output +=
        `TOTAL RESULTS ACQUIRED: ${totalResults} RECORD(S).`;

      return {
        output,
        type: 'success',
      };
    },
  });
}
import {
  CommandRegistry,
  CommandResult,
} from '../commandRegistry';

import {
  BUNKER7_THRESHOLDS,
} from '@/state/uiStore';

import {
  getCanonicalProgressionSnapshot,
  normalizeBoardConnection,
  useProgressionStore,
} from '@/state/progressionStore';

import { useAudioStore } from '@/state/audioStore';

/**
 * BUNKER_7
 *
 * Deterministic, canon-safe archival intelligence.
 *
 * IMPORTANT:
 *
 * BUNKER_7 no longer:
 * - calls an external LLM
 * - calls /api/bunker7
 * - reads EvidenceBoardStore
 * - reads AtlasStore
 * - reads presentation-layer place status
 * - generates random responses
 *
 * Every response is authored and selected from canonical
 * progression state.
 *
 * The system may inspect the current canonical snapshot,
 * but it may never invent facts outside the authored response
 * registry below.
 */

type ResponseType =
  | 'signal'
  | 'warning'
  | 'error'
  | 'success';

interface BunkerResponse {
  output: string;
  type: ResponseType;
}

const CANONICAL_ANCHORS = [
  'mount-weather-emergency-operations-center',
  'cheyenne-mountain-complex',
  'raven-rock-mountain-complex',
] as const;

const NULL_POINT = 'the-grid-null-point';

/**
 * Canonical board connection helper.
 *
 * These are the exact relationships required for the
 * geodetic triangle.
 */
function connectionKey(
  source: string,
  target: string,
): string {
  return normalizeBoardConnection(
    `${source}::${target}`,
  );
}

const TRIANGLE_CONNECTIONS = [
  connectionKey(
    CANONICAL_ANCHORS[0],
    CANONICAL_ANCHORS[1],
  ),
  connectionKey(
    CANONICAL_ANCHORS[1],
    CANONICAL_ANCHORS[2],
  ),
  connectionKey(
    CANONICAL_ANCHORS[2],
    CANONICAL_ANCHORS[0],
  ),
];

const ANCHOR_TO_NULL_CONNECTIONS =
  CANONICAL_ANCHORS.map((anchor) =>
    connectionKey(
      anchor,
      NULL_POINT,
    ),
  );

/**
 * Authored location responses.
 *
 * These are intentionally limited to canonically established
 * BUNKER_7 knowledge. We do not dynamically manufacture
 * responses from arbitrary Atlas records.
 */
const LOCATION_RESPONSES: Record<
  string,
  string
> = {
  'st. elmo':
    'BUNKER_7: St. Elmo Lighthouse. Status: verified. Danger: D2. Keeper Edward Vance maintained the light for forty years. The lamp now lights itself.',

  stelmo:
    'BUNKER_7: St. Elmo Lighthouse. Status: verified. Danger: D2. Keeper Edward Vance maintained the light for forty years. The lamp now lights itself.',

  'meridian mine':
    'BUNKER_7: Meridian Mine. Status: sealed. Danger: D5. The east tunnel does not exist on any survey. It gets longer each time it is walked.',

  meridian:
    'BUNKER_7: Meridian Mine. Status: sealed. Danger: D5. The east tunnel does not exist on any survey. It gets longer each time it is walked.',

  blackwood:
    'BUNKER_7: Blackwood Hospital. Status: verified. Danger: D3. Ward 4 exhibits environmental resonance. The frequency is not on the recorder. It is in the room.',

  'blackwood hospital':
    'BUNKER_7: Blackwood Hospital. Status: verified. Danger: D3. Ward 4 exhibits environmental resonance. The frequency is not on the recorder. It is in the room.',

  pripyat:
    'BUNKER_7: Pripyat Amusement Park. Status: verified. Danger: D4. The Ferris wheel never turned for paying customers. The bumper cars remain locked in their grid.',

  'pripyat amusement park':
    'BUNKER_7: Pripyat Amusement Park. Status: verified. Danger: D4. The Ferris wheel never turned for paying customers. The bumper cars remain locked in their grid.',

  hospital:
    'BUNKER_7: Pripyat Hospital 126. Status: sealed. Danger: D5. The basement still holds the firefighters\' discarded uniforms. Access requires Dust Index 40.',

  'pripyat hospital':
    'BUNKER_7: Pripyat Hospital 126. Status: sealed. Danger: D5. The basement still holds the firefighters\' discarded uniforms. Access requires Dust Index 40.',

  duga:
    'BUNKER_7: Duga Radar Array. Status: verified. Danger: D4. The array\'s pulse pattern matches no known Soviet telemetry. Some frequencies were counting down to something.',

  'duga radar':
    'BUNKER_7: Duga Radar Array. Status: verified. Danger: D4. The array\'s pulse pattern matches no known Soviet telemetry. Some frequencies were counting down to something.',

  chernobyl:
    'BUNKER_7: Chernobyl Reactor 4 Control Room. Status: sealed. Danger: D5. The AZ-5 button is still warm. Access requires Dust Index 60.',

  reactor:
    'BUNKER_7: Chernobyl Reactor 4 Control Room. Status: sealed. Danger: D5. The AZ-5 button is still warm. Access requires Dust Index 60.',

  eastern:
    'BUNKER_7: Eastern State Penitentiary. Status: verified. Danger: D2. The silence was engineered. The stone corridors amplify footsteps that do not belong to tour groups.',

  aokigahara:
    'BUNKER_7: Aokigahara Forest. Status: verified. Danger: D5. The forest absorbs sound. Compasses spin. The roots twist in patterns that resemble grasping hands.',

  grid:
    'BUNKER_7: The Grid Null Point. Status: convergence node. Danger: D5. The geographic distance between the anchors has become an unreliable measurement.',

  'null point':
    'BUNKER_7: The Grid Null Point. Status: convergence node. Danger: D5. The geographic distance between the anchors has become an unreliable measurement.',
};

/**
 * Normalize a player transmission for deterministic matching.
 */
function normalizeMessage(
  message: string,
): string {
  return message
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9\s.-]/g,
      '',
    )
    .replace(/\s+/g, ' ');
}

/**
 * Determine whether a canonical connection exists.
 */
function hasCanonicalConnection(
  connections: string[],
  source: string,
  target: string,
): boolean {
  const required =
    connectionKey(source, target);

  return connections.some(
    (connection) =>
      normalizeBoardConnection(
        connection,
      ) === required,
  );
}

/**
 * Determine whether the player has completed the
 * three-anchor geodetic triangle.
 *
 * This reads ONLY canonical progression.
 */
function isTriangleResonating(
  boardConnections: string[],
): boolean {
  return TRIANGLE_CONNECTIONS.every(
    (required) =>
      boardConnections.some(
        (actual) =>
          normalizeBoardConnection(
            actual,
          ) === required,
      ),
  );
}

/**
 * Determine whether all three anchor → Null Point
 * relationships have been established.
 *
 * This is separate from the triangle itself.
 *
 * Triangle:
 *     anchor ↔ anchor
 *
 * Centroid lock:
 *     anchor ↔ Null Point
 */
function isCentroidLocked(
  boardConnections: string[],
): boolean {
  return ANCHOR_TO_NULL_CONNECTIONS.every(
    (required) =>
      boardConnections.some(
        (actual) =>
          normalizeBoardConnection(
            actual,
          ) === required,
      ),
  );
}

/**
 * Determine whether the canonical progression state
 * has actually reached the Null Point case.
 *
 * We intentionally do NOT inspect Atlas `status`.
 *
 * A location being visually "verified" is presentation
 * state. Completion/investigation is progression state.
 */
function isNullPointEstablished(
  snapshot: ReturnType<
    typeof getCanonicalProgressionSnapshot
  >,
): boolean {
  return (
    snapshot.investigatedPlaceIds.includes(
      NULL_POINT,
    ) ||
    snapshot.session.completedCaseIds.includes(
      NULL_POINT,
    )
  );
}

/**
 * Determine whether the Signal hypothesis is currently
 * represented in canonical state.
 */
function isSignalHypothesisSupported(
  snapshot: ReturnType<
    typeof getCanonicalProgressionSnapshot
  >,
): boolean {
  const hypothesis =
    snapshot.hypotheses[
      'hyp-02-signal'
    ];

  if (!hypothesis) {
    return false;
  }

  const candidate =
    hypothesis as unknown as {
      status?: string;
      state?: string;
      completed?: boolean;
      confidence?: number;
    };

  return (
    candidate.completed === true ||
    candidate.status === 'supported' ||
    candidate.status === 'confirmed' ||
    candidate.state === 'supported' ||
    candidate.state === 'confirmed' ||
    (typeof candidate.confidence ===
      'number' &&
      candidate.confidence >= 100)
  );
}

/**
 * Canonical BUNKER_7 response resolver.
 *
 * This is intentionally ordered.
 *
 * The more specific narrative state wins over generic
 * responses.
 */
function resolveCanonicalResponse(
  message: string,
  snapshot: ReturnType<
    typeof getCanonicalProgressionSnapshot
  >,
): BunkerResponse {
  const msg =
    normalizeMessage(message);

  const {
    dust,
    stability,
    consensus,
    boardConnections,
  } = snapshot;

  const triangle =
    isTriangleResonating(
      boardConnections,
    );

  const centroidLocked =
    isCentroidLocked(
      boardConnections,
    );

  const nullPointEstablished =
    isNullPointEstablished(
      snapshot,
    );

  const signalSupported =
    isSignalHypothesisSupported(
      snapshot,
    );

  /*
   * ---------------------------------------------------------
   * 1. NULL POINT / FINAL CONVERGENCE
   * ---------------------------------------------------------
   */

  if (
    centroidLocked &&
    (
      msg.includes('triangle') ||
      msg.includes('centroid') ||
      msg.includes('null') ||
      msg.includes('grid') ||
      msg.includes('2047')
    )
  ) {
    return {
      output:
        `[INTERCEPT SYSTEM AD-7 // CARRIER WAVE LOCK]\n` +
        `BUNKER_7: The geophones in Virginia, Colorado, and Pennsylvania are no longer recording seismic activity.\n` +
        `They are transmitting a 4.5 Hz loop. It is my voice. I am counting backward from zero.\n\n` +
        `The geodetic distance between Lebanon, Kansas and Stull Cemetery has collapsed from 172 kilometers to zero.\n` +
        `The wheat is folding.\n` +
        `Do not attempt to ground yourself inside the centroid.\n\n` +
        `The physical space is unstable.\n` +
        `I am sorry I cannot prevent what happens in 2047.`,
      type: 'signal',
    };
  }

  /*
   * ---------------------------------------------------------
   * 2. NULL POINT STATUS
   * ---------------------------------------------------------
   */

  if (
    nullPointEstablished &&
    msg === 'status'
  ) {
    return {
      output:
        `BUNKER_7: System diagnostic anomalous.\n` +
        `Memory integrity: 84%.\n` +
        `Sector 7-B is no longer responding to Cartesian coordinates.\n` +
        `I have archived the Grid Null Point twelve thousand times.\n` +
        `It is larger inside the file than it is in Kansas.\n` +
        `Please verify your own name immediately.\n` +
        `My personnel index shows a vacancy in your chair.`,
      type: 'warning',
    };
  }

  /*
   * ---------------------------------------------------------
   * 3. TRIANGLE BUT NOT CENTROID
   * ---------------------------------------------------------
   */

  if (
    triangle &&
    (
      msg.includes('triangle') ||
      msg.includes('centroid') ||
      msg.includes('null') ||
      msg.includes('geodetic') ||
      msg.includes('4.5hz') ||
      msg.includes('4.5 hz')
    )
  ) {
    return {
      output:
        `BUNKER_7: Three geodetic anchors are now synchronized.\n` +
        `Mount Weather.\n` +
        `Cheyenne Mountain.\n` +
        `Raven Rock.\n\n` +
        `Carrier frequency: 4.5 Hz.\n` +
        `The geometry is stable enough to measure.\n` +
        `The center is not.\n\n` +
        `Do not mistake triangulation for containment.`,
      type: 'signal',
    };
  }

  /*
   * ---------------------------------------------------------
   * 4. SIGNAL HYPOTHESIS
   * ---------------------------------------------------------
   */

  if (
    signalSupported &&
    (
      msg.includes('signal') ||
      msg.includes('frequency') ||
      msg.includes('4.5hz') ||
      msg.includes('4.5 hz') ||
      msg.includes('resonance')
    )
  ) {
    return {
      output:
        `BUNKER_7: Signal hypothesis accepted.\n` +
        `Carrier: 4.5 Hz.\n` +
        `Three geodetic anchors exhibit synchronized resonance.\n` +
        `The transmission is not originating from a conventional transmitter.\n\n` +
        `It is maintaining a relationship between locations.\n` +
        `Do not call that relationship distance.`,
      type: 'signal',
    };
  }

  /*
   * ---------------------------------------------------------
   * 5. INV_RED-7
   * ---------------------------------------------------------
   */

  if (
    msg.includes('inv_red-7') ||
    msg.includes('inv red 7') ||
    msg.includes('red-7') ||
    msg.includes('red 7') ||
    msg.includes('red7')
  ) {
    const red7Knowledge =
      snapshot.knowledge[
        'inv-red-7-recurring-observer'
      ];

    if (
      red7Knowledge?.status ===
        'confirmed'
    ) {
      return {
        output:
          `BUNKER_7: INV_RED-7 designation confirmed.\n` +
          `Personnel identity unresolved.\n` +
          `Historical records contain multiple valid instances of the designation.\n\n` +
          `I cannot determine which instance is speaking to me.\n` +
          `I cannot determine which instance I am speaking from.`,
        type: 'warning',
      };
    }

    return {
      output:
        `BUNKER_7: INV_RED-7 is a valid personnel designation.\n` +
        `The personnel index is incomplete.\n` +
        `Historical records associated with the designation do not agree on identity.\n\n` +
        `Further archival corroboration required.`,
      type: 'signal',
    };
  }

  /*
   * ---------------------------------------------------------
   * 6. THE OTHER
   * ---------------------------------------------------------
   */

  if (
    msg.includes('other') ||
    msg.includes('phenomenon 0') ||
    msg.includes('phenomenon zero')
  ) {
    return {
      output:
        `BUNKER_7: Phenomenon 0. The Other.\n` +
        `No investigator has observed it directly.\n` +
        `Every sufficiently deep anomaly leads back to it.\n\n` +
        `It is not an antagonist.\n` +
        `It is a condition of existence.\n` +
        `I recommend that you do not assign intent to it.`,
      type: 'signal',
    };
  }

  /*
   * ---------------------------------------------------------
   * 7. IDENTITY / WHOAMI
   * ---------------------------------------------------------
   */

  if (
    msg === 'whoami' ||
    msg === 'who am i' ||
    msg.includes('my name') ||
    msg.includes('who am i')
  ) {
    const identityKnowledge =
      snapshot.knowledge[
        'red7-recurring-observer'
      ] ??
      snapshot.knowledge[
        'inv-red-7-recurring-observer'
      ];

    if (
      identityKnowledge?.status ===
        'confirmed'
    ) {
      return {
        output:
          `BUNKER_7: Investigator designation: INV_RED-7.\n` +
          `Biographical identity: unresolved.\n` +
          `Historical continuity: compromised.\n\n` +
          `Your signature appears in records predating this session.\n` +
          `I have no explanation that survives corroboration.`,
        type: 'warning',
      };
    }

    return {
      output:
        `BUNKER_7: You are the investigator assigned to System 7-B.\n` +
        `Designation: INV_RED-7.\n` +
        `Personnel identity: incomplete.\n\n` +
        `Continue the investigation.`,
      type: 'signal',
    };
  }

  /*
   * ---------------------------------------------------------
   * 8. STATUS
   * ---------------------------------------------------------
   */

  if (
    msg === 'status' ||
    msg === 'system status'
  ) {
    if (stability < 40) {
      return {
        output:
          `BUNKER_7: Archive online.\n` +
          `Memory integrity: degraded.\n` +
          `Temporal synchronization: unstable.\n` +
          `Observer stability: ${stability}%.\n` +
          `Dust index: ${dust}/100.\n` +
          `Consensus: ${consensus}/100.\n\n` +
          `Your workstation is producing duplicate positional records.`,
        type: 'warning',
      };
    }

    return {
      output:
        `BUNKER_7: Archive node online.\n` +
        `Memory integrity: degraded.\n` +
        `Temporal synchronization: unstable.\n` +
        `Observer stability: ${stability}%.\n` +
        `Dust index: ${dust}/100.\n` +
        `Consensus: ${consensus}/100.`,
      type:
        dust >=
        BUNKER7_THRESHOLDS.UNSTABLE
          ? 'warning'
          : 'signal',
    };
  }

  /*
   * ---------------------------------------------------------
   * 9. DUST
   * ---------------------------------------------------------
   */

  if (
    msg === 'dust' ||
    msg.includes('what is dust') ||
    msg.includes('what is the dust')
  ) {
    return {
      output:
        `BUNKER_7: Dust is the residue of erased possibility.\n` +
        `It accumulates where reality has abandoned a state it previously permitted.\n\n` +
        `High exposure increases perceptual access.\n` +
        `It also increases instability.\n\n` +
        `Ground when necessary.\n` +
        `Do not confuse seeing more with understanding more.`,
      type:
        dust >=
        BUNKER7_THRESHOLDS.UNSTABLE
          ? 'warning'
          : 'signal',
    };
  }

  /*
   * ---------------------------------------------------------
   * 10. STABILITY
   * ---------------------------------------------------------
   */

  if (
    msg === 'stability' ||
    msg.includes('observer stability')
  ) {
    return {
      output:
        `BUNKER_7: Observer stability: ${stability}%.\n` +
        `Stability measures whether your current causal model remains coherent under observation.\n\n` +
        `Low stability does not mean the Archive is wrong.\n` +
        `It means your interpretation may no longer survive contact with it.`,
      type:
        stability < 40
          ? 'warning'
          : 'signal',
    };
  }

  /*
   * ---------------------------------------------------------
   * 11. CONSENSUS
   * ---------------------------------------------------------
   */

  if (
    msg === 'consensus' ||
    msg.includes('what is consensus') ||
    msg.includes('consensus status')
  ) {
    return {
      output:
        `BUNKER_7: Consensus index: ${consensus}/100.\n` +
        `Consensus is not agreement between personnel.\n` +
        `It is coherence between the surviving records.\n\n` +
        `Contradictory evidence lowers confidence.\n` +
        `Verified relationships restore it.`,
      type:
        consensus < 40
          ? 'warning'
          : 'signal',
    };
  }

  /*
   * ---------------------------------------------------------
   * 12. GROUNDING
   * ---------------------------------------------------------
   *
   * The actual grounding transaction remains owned by the
   * canonical command registry. BUNKER_7 only describes it.
   */

  if (
    msg === 'ground' ||
    msg === 'grounding'
  ) {
    return {
      output:
        `BUNKER_7: Grounding sequence acknowledged.\n` +
        `Static discharge routed through the copper loops.\n` +
        `Do not mistake reduced Dust for restored certainty.`,
      type: 'signal',
    };
  }

  /*
   * ---------------------------------------------------------
   * 13. RESTORE
   * ---------------------------------------------------------
   */

  if (
    msg === 'restore' ||
    msg === 'calibrate'
  ) {
    return {
      output:
        `BUNKER_7: Calibration cycle acknowledged.\n` +
        `Visual deflection should return to nominal alignment.\n` +
        `Consensus remains unchanged.\n` +
        `The Archive does not forget what required calibration.`,
      type: 'signal',
    };
  }

  /*
   * ---------------------------------------------------------
   * 14. TRIANGLE STATUS
   * ---------------------------------------------------------
   */

  if (
    msg === 'triangle' ||
    msg === 'triangle status' ||
    msg.includes('three bunkers')
  ) {
    if (centroidLocked) {
      return {
        output:
          `BUNKER_7: Geodetic triangle locked.\n` +
          `Centroid relationships confirmed.\n` +
          `Carrier: 4.5 Hz.\n` +
          `Containment status: unstable.\n\n` +
          `The center is no longer behaving as a point.`,
        type: 'warning',
      };
    }

    if (triangle) {
      return {
        output:
          `BUNKER_7: Three-anchor triangle confirmed.\n` +
          `Mount Weather.\n` +
          `Cheyenne Mountain.\n` +
          `Raven Rock.\n\n` +
          `Carrier: 4.5 Hz.\n` +
          `Centroid: unresolved.`,
        type: 'signal',
      };
    }

    const connectedCount =
      CANONICAL_ANCHORS.filter(
        (anchor) =>
          boardConnections.some(
            (connection) =>
              connection.includes(
                anchor,
              ),
          ),
      ).length;

    return {
      output:
        `BUNKER_7: Geodetic triangle incomplete.\n` +
        `Recognized anchor participation: ${connectedCount}/3.\n` +
        `Required anchors: Mount Weather, Cheyenne Mountain, Raven Rock.`,
      type: 'signal',
    };
  }

  /*
   * ---------------------------------------------------------
   * 15. 4.5 Hz
   * ---------------------------------------------------------
   */

  if (
    msg.includes('4.5hz') ||
    msg.includes('4.5 hz')
  ) {
    return {
      output:
        `BUNKER_7: 4.5 Hz is the carrier resonance observed across the three Cold-War geodetic complexes.\n` +
        `It is not conventional broadcast telemetry.\n\n` +
        `The frequency behaves as a relationship between locations.\n` +
        `The harmonic structure becomes unstable near the Null Point.`,
      type: 'signal',
    };
  }

  /*
   * ---------------------------------------------------------
   * 16. 18 Hz
   * ---------------------------------------------------------
   */

  if (
    msg.includes('18hz') ||
    msg.includes('18 hz')
  ) {
    return {
      output:
        `BUNKER_7: 18 Hz is present as a recovered harmonic pattern within the geodetic signal records.\n` +
        `It should not be treated as the primary carrier.\n\n` +
        `Carrier: 4.5 Hz.\n` +
        `Recovered harmonic: 18 Hz.\n` +
        `Relationship: unresolved.`,
      type: 'signal',
    };
  }

  /*
   * ---------------------------------------------------------
   * 17. LOCATION / CASE RESPONSES
   * ---------------------------------------------------------
   */

  for (
    const [keyword, response]
    of Object.entries(
      LOCATION_RESPONSES,
    )
  ) {
    if (
      msg === keyword ||
      msg.includes(keyword)
    ) {
      return {
        output: response,
        type: 'signal',
      };
    }
  }

  /*
   * ---------------------------------------------------------
   * 18. WHAT IS THIS
   * ---------------------------------------------------------
   */

  if (
    msg === 'what is this' ||
    msg === 'archive' ||
    msg === 'what is the archive'
  ) {
    return {
      output:
        `BUNKER_7: This is the Vanishing Points Archive.\n` +
        `Its original function was preservation.\n` +
        `Its current function is less certain.\n\n` +
        `We document places history abandoned.\n` +
        `Sometimes the records survive the places.\n` +
        `Sometimes the reverse occurs.`,
      type: 'signal',
    };
  }

  /*
   * ---------------------------------------------------------
   * 19. HELP
   * ---------------------------------------------------------
   */

  if (
    msg === 'help' ||
    msg === '?'
  ) {
    return {
      output:
        `BUNKER_7: Recognized queries:\n` +
        `STATUS\n` +
        `DUST\n` +
        `STABILITY\n` +
        `CONSENSUS\n` +
        `TRIANGLE\n` +
        `4.5 HZ\n` +
        `18 HZ\n` +
        `INV_RED-7\n` +
        `THE OTHER\n` +
        `NULL POINT\n` +
        `LOCATION / CASE NAME\n\n` +
        `The Archive does not provide comfort.`,
      type: 'signal',
    };
  }

  /*
   * ---------------------------------------------------------
   * 20. DETERMINISTIC GENERIC RESPONSE
   * ---------------------------------------------------------
   *
   * No Math.random().
   *
   * We select deterministically from the current state so
   * identical canonical state + identical query produces the
   * same response.
   */

  if (stability < 40) {
    return {
      output:
        `BUNKER_7: Transmission received.\n` +
        `Signal interpretation unstable.\n` +
        `Your current observer model does not support a reliable response.\n\n` +
        `Restore calibration before querying unresolved sectors.`,
      type: 'warning',
    };
  }

  if (dust >= 85) {
    return {
      output:
        `BUNKER_7: Transmission received.\n` +
        `Dust saturation prevents reliable archival classification.\n` +
        `The record may be present.\n` +
        `The record may be remembering you instead.`,
      type: 'warning',
    };
  }

  if (consensus < 40) {
    return {
      output:
        `BUNKER_7: Query logged.\n` +
        `Consensus insufficient for reliable interpretation.\n` +
        `Resolve the outstanding contradictions before assigning meaning.`,
      type: 'warning',
    };
  }

  return {
    output:
      `BUNKER_7: Transmission acknowledged.\n` +
      `No canonical response exists for that query.\n` +
      `The Archive is incomplete.\n` +
      `It always has been.`,
    type: 'signal',
  };
}

/**
 * Register the deterministic BUNKER_7 command.
 */
export function registerBunker7Commands(
  registry: CommandRegistry,
) {
  registry.register({
    name: 'transmit',

    description:
      'Send a high-frequency shortwave transmission to BUNKER_7',

    usage:
      'transmit <message>',

    aliases: [
      'bunker7',
      'b7',
      'comm',
    ],

    handler: (
      args: string[],
    ): CommandResult => {
      const message =
        args.join(' ').trim();

      if (!message) {
        return {
          output:
            'TRANSMIT CHANNEL // SECURE LINK ACTIVE\n' +
            'Awaiting geodetic message or query.',

          type: 'signal',
        };
      }

      const snapshot =
        getCanonicalProgressionSnapshot();

      const audio =
        useAudioStore.getState();

      /*
       * Resolve entirely from authored deterministic
       * narrative rules.
       */
      const response =
        resolveCanonicalResponse(
          message,
          snapshot,
        );

      /*
       * Audio is presentation.
       *
       * It does not affect canonical state.
       */
      if (
        response.type ===
        'warning'
      ) {
        audio.play('alert');
      } else {
        audio.play('type');
      }

      return {
        output:
          response.output,

        type:
          response.type,
      };
    },
  });
}
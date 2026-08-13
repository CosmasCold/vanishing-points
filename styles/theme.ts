export const colors = {
  archive: {
    black: '#0f0b08', // Deeper, more atmospheric terminal black
    surface: '#16110d', // Dark weathered wood/bakelite surface
    surfaceRaised: '#221914', // Lighter panel background
    amber: '#dfb27c', // Richer amber glare
    amberDim: 'rgba(223, 178, 124, 0.15)',
    blue: '#5c7b8f', // Soft radio static blue
    blueBright: '#7ba0b8', // Glowing shortwave carrier blue
    green: '#638c63', // Calibrated radar phosphor green
    greenBright: '#82b582', // Glowing phosphor green
    red: '#994f4f', // Deep warning red
    redBright: '#bf6c6c', // Glowing signal alert red
    white: '#f2ece0', // Slightly yellowed declassified paper white
    grayLight: '#9e998e',
    gray: '#5a5650', // Damp stone gray
    grayDark: '#2a2723', // Dark border gray
    deskLamp: 'rgba(255, 170, 85, 0.04)',
    shadow: 'rgba(0, 0, 0, 0.6)',
  },
};

export const typography = {
  mono: '"SF Mono", "Fira Code", "Consolas", ui-monospace, monospace',
  serif: '"Georgia", "Times New Roman", "Crimson Text", serif',
  
  // OPTIMIZED RELATIVE UNITS: Scales font sizes up nicely for high readability
  // while preventing absolute pixel boundaries from breaking responsive canvas scaling.
  sizes: {
    xs: '0.725rem',     // Increased for crisp readability of metadata tags
    sm: '0.875rem',     // Clear sidebar text
    base: '1.025rem',   // Highly readable default body text
    lg: '1.25rem',      // Solid headings
    xl: '1.675rem',     // Cinematic displays
  },
  
  weights: {
    light: '300',
    regular: '400',
    normal: 400,        // Supports older component imports to prevent compile blocks
    medium: '500',
    bold: '700',
  }
};

export const spacing = {
  rail: '4.75rem',
  statusBar: '2rem',
  terminalHeight: '28rem', // Restored: Defines essential layout proportions for panels
  modulePanel: '22rem',    // Restored: Prevents sidebar collapse and off-proportion stretching
};

export const shadows = {
  paper: '0 12px 36px rgba(0,0,0,0.9)',
  lamp: '0 0 40px rgba(255, 240, 200, 0.04)',                              // Restored
  depth: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 24px rgba(0,0,0,0.5)', // Restored
};

export const timing = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  panelSlide: 0.35, // Restored: Re-aligns modular panels sliding open smoothly
};

export const microform = {
  halogen: '#ffaa55', // Solenoid filament glow
  halogenDim: 'rgba(255, 170, 85, 0.08)',
  halogenGlow: 'rgba(255, 170, 85, 0.15)',
  halogenText: '0 0 5px rgba(255,170,85,0.45)',
  mahogany: '#201612',
  mahoganyLight: '#2f1a14',
  iron: '#2d2924',
  ironBorder: '1px solid #2d2924',
  paperWarm: '#f0ebe0',
  frosted: 'rgba(232, 228, 217, 0.025)',
  chassisShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -2px 6px rgba(0,0,0,0.6)',
  opticalBlur: 'blur(0.4px)',
} as const;

export const bezels = {
  heavy: `1px solid ${microform.iron}, 0 0 0 2px ${microform.mahogany}, 0 0 0 3px ${microform.iron}`, // Restored
  screenInset: 'inset 0 0 30px rgba(0,0,0,0.7), inset 0 0 4px rgba(0,0,0,0.9)',                      // Restored
} as const;

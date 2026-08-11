export const colors = {
  archive: {
    black: '#070503', // Deeper, more atmospheric terminal black
    surface: '#12100e', // Dark weathered wood/bakelite surface
    surfaceRaised: '#1a1714', // Lighter panel background
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

export const spacing = {
  rail: '3.5rem',
  statusBar: '2rem',
  terminalHeight: '28rem',
  modulePanel: '22rem',
};

export const shadows = {
  paper: '0 12px 36px rgba(0,0,0,0.9)',
  lamp: '0 0 40px rgba(255, 240, 200, 0.04)',
  depth: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 24px rgba(0,0,0,0.5)',
};

export const typography = {
  mono: '"SF Mono", "Fira Code", "Consolas", ui-monospace, monospace',
  serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
  
  // INCREASED TEXT SIZES - Scales up the entire interface\'s readability cleanly
  sizes: {
    xs: '11.5px', // Up from 9.5px
    sm: '13.5px', // Up from 11.5px
    base: '15px',  // Up from 13px
    lg: '18px',   // Up from 16px
    xl: '22px',   // Up from 19px
  },
  
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    bold: '700',
  }
};

export const timing = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  panelSlide: 0.35,
};

export const microform = {
  halogen: '#ffaa55', // Solenoid filament glow
  halogenDim: 'rgba(255, 170, 85, 0.08)',
  halogenGlow: 'rgba(255, 170, 85, 0.15)',
  halogenText: '0 0 5px rgba(255,170,85,0.45)',
  iron: '#2d2924',
  ironBorder: '1px solid #1a1a1a',
  mahogany: '#201612',
  mahoganyLight: '#2f1a14',
  paperWarm: '#f0ebe0',
  frosted: 'rgba(232, 228, 217, 0.025)',
  chassisShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -2px 6px rgba(0,0,0,0.6)',
  opticalBlur: 'blur(0.4px)',
} as const;

export const bezels = {
  heavy: `1px solid ${microform.iron}, 0 0 0 2px ${microform.mahogany}, 0 0 0 3px ${microform.iron}`,
  screenInset: 'inset 0 0 30px rgba(0,0,0,0.7), inset 0 0 4px rgba(0,0,0,0.9)',
} as const;

export const colors = {
  archive: {
    black: '#070503', // Deeper, more atmospheric terminal black [274]
    surface: '#12100e', // Dark weathered wood/bakelite surface [274]
    surfaceRaised: '#1a1714', // Lighter panel background [274]
    amber: '#dfb27c', // Richer amber glare [274]
    amberDim: 'rgba(223, 178, 124, 0.15)', // [274]
    blue: '#5c7b8f', // Soft radio static blue [274]
    blueBright: '#7ba0b8', // Glowing shortwave carrier blue [274]
    green: '#638c63', // Calibrated radar phosphor green [274]
    greenBright: '#82b582', // Glowing phosphor green [274]
    red: '#994f4f', // Deep warning red [274]
    redBright: '#bf6c6c', // Glowing signal alert red [274]
    white: '#f2ece0', // Slightly yellowed declassified paper white [274]
    grayLight: '#9e998e', // [274]
    gray: '#5a5650', // Damp stone gray [274]
    grayDark: '#2a2723', // Dark border gray [274]
    deskLamp: 'rgba(255, 170, 85, 0.04)', // [274]
    shadow: 'rgba(0, 0, 0, 0.6)', // [274]
  },
};

export const spacing = {
  rail: '3.5rem', // [275]
  statusBar: '2rem', // [275]
  terminalHeight: '28rem', // [275]
  modulePanel: '22rem', // [275]
};

export const shadows = {
  paper: '0 12px 36px rgba(0,0,0,0.9)', // Deepened paper shadow [275]
  lamp: '0 0 40px rgba(255, 170, 85, 0.04)', // [275]
  depth: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 24px rgba(0,0,0,0.5)', // [275]
};

export const typography = {
 Mono: '"SF Mono", "Fira Code", "Consolas", ui-monospace, monospace', // [275]
  mono: "'Courier New', Courier, monospace",
  serif: "Georgia, Cambria, 'Times New Roman', Times, serif",
  
  // INCREASED TEXT SIZES - Scales up the entire interface's readability cleanly [275]
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
    normal: '400', // Formally supports both names to secure compile-safety [101]
    medium: '500',
    bold: '700',
  }
};

export const timing = {
  fast: 0.15, // [276]
  normal: 0.3, // [276]
  slow: 0.5, // [276]
  panelSlide: 0.35, // [276]
};

export const microform = {
  halogen: '#ffaa55', // Solenoid filament glow [276]
  halogenDim: 'rgba(255, 170, 85, 0.08)', // [276]
  halogenGlow: 'rgba(255, 170, 85, 0.15)', // [276]
  halogenText: '0 0 5px rgba(255,170,85,0.45)', // [276]
  mahogany: '#201612', // [276]
  mahoganyLight: '#2f1a14', // [276]
  iron: '#2d2924', // [276]
  ironBorder: '1px solid #1a1a1a', // [276]
  paperWarm: '#f0ebe0', // [276]
  frosted: 'rgba(232, 228, 217, 0.025)', // [276]
  chassisShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -2px 6px rgba(0,0,0,0.6)', // [276]
  opticalBlur: 'blur(0.4px)', // [276]
} as const;

export const bezels = {
  heavy: `1px solid ${microform.iron}, 0 0 0 2px ${microform.mahogany}, 0 0 0 3px ${microform.iron}`, // [277]
  screenInset: 'inset 0 0 30px rgba(0,0,0,0.7), inset 0 0 4px rgba(0,0,0,0.9)', // [277]
} as const;

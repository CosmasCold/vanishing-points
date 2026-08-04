export const colors = {
  // Functional colors with meaning
  archive: {
    green: '#5a7c5a',      // Stable archived information
    greenBright: '#7a9a7a',
    amber: '#b8956a',      // Warnings, cautions
    amberBright: '#d4b48a',
    red: '#8a5a5a',        // Confirmed danger
    redBright: '#a87878',
    blue: '#6a7a8a',       // Signals, resonance, unknown
    blueBright: '#8a9aaa',
    white: '#c8c4b8',      // Recovered documents
    gray: '#5a5854',       // Inactive systems
    grayLight: '#8a8884',
    black: '#1a1a18',      // Deep background
    surface: '#2a2a26',    // Panel surfaces
    surfaceRaised: '#32322e',
  },
  // Semantic mapping
  status: {
    stable: '#5a7c5a',
    warning: '#b8956a',
    danger: '#8a5a5a',
    signal: '#6a7a8a',
    inactive: '#5a5854',
  }
} as const;

export const typography = {
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  serif: 'Georgia, "Times New Roman", serif',
  sans: 'system-ui, -apple-system, sans-serif',
  sizes: {
    xs: '0.6875rem',    // 11px - metadata, labels
    sm: '0.75rem',      // 12px - body secondary
    base: '0.8125rem',  // 13px - body primary
    md: '0.875rem',     // 14px - panel headers
    lg: '1rem',         // 16px - section titles
    xl: '1.125rem',     // 18px - major headers
    '2xl': '1.25rem',   // 20px - rare, emphasis
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
  }
} as const;

export const spacing = {
  rail: '3.5rem',
  statusBar: '1.75rem',
  terminalHeight: '12rem',
  panelGap: '0.25rem',
  border: '1px solid rgba(90, 88, 84, 0.3)',
} as const;

export const timing = {
  bootPhaseMin: 400,
  bootPhaseMax: 1200,
  panelSlide: 0.3,
  terminalSlide: 0.25,
  fade: 0.2,
} as const;
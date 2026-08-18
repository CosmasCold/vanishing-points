export const ARCHIVE_MATERIALS = {
  paper: { surface: 'parchment', shadow: 'paper' },
  photograph: { surface: 'photographic-stock', shadow: 'contact' },
  wood: { surface: 'dark-walnut', shadow: 'deep' },
  metal: { surface: 'aged-metal', shadow: 'equipment' },
  glass: { surface: 'aged-glass', shadow: 'reflective' },
  leather: { surface: 'worn-leather', shadow: 'deep' },
  crt: { surface: 'crt-glass', shadow: 'screen' },
} as const;

export type ArchiveMaterial = keyof typeof ARCHIVE_MATERIALS;

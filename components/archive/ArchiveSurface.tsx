'use client';
import React from 'react';
export type ArchiveSurfaceTone='paper'|'wood'|'metal'|'leather'|'dark'|'glass';
export function ArchiveSurface({ tone='paper', className='', children, ...props }: React.HTMLAttributes<HTMLDivElement> & { tone?:ArchiveSurfaceTone }) {
  return <div {...props} data-archive-surface={tone} className={`archive-surface archive-surface-${tone} ${className}`}>{children}</div>;
}

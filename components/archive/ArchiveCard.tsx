'use client';
import React from 'react';
import { ArchiveStamp } from './ArchiveStamp';

export interface ArchiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  status?: string;
  statusState?: string;
  title?: string;
  source?: string;
  selected?: boolean;
}

export function ArchiveCard({ eyebrow, status, statusState='known', title, source, selected=false, className='', children, ...props }: ArchiveCardProps) {
  return (
    <article {...props} data-archive-card data-selected={selected || undefined} className={`archive-card ${selected ? 'archive-card-selected' : ''} ${className}`}>
      {(eyebrow || status) && <header className="archive-card-header">
        {eyebrow && <span className="archive-card-eyebrow">{eyebrow}</span>}
        {status && <ArchiveStamp label={status} state={statusState} />}
      </header>}
      {title && <h3 className="archive-card-title">{title}</h3>}
      <div className="archive-card-body">{children}</div>
      {source && <footer className="archive-card-source">SOURCE // {source}</footer>}
    </article>
  );
}

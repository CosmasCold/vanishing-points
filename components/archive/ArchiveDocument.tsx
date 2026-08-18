'use client';
import React from 'react';
import { ArchiveStamp } from './ArchiveStamp';

export function ArchiveDocument({ title, reference, status, children, className='', ...props }: React.HTMLAttributes<HTMLElement> & { title?: string; reference?: string; status?: string }) {
  return (
    <article {...props} className={`archive-document ${className}`}>
      <header className="archive-document-header">
        <div>
          <div className="archive-document-kicker">ARCHIVE DOCUMENT</div>
          {title && <h2 className="archive-document-title">{title}</h2>}
          {reference && <div className="archive-document-reference">REF // {reference}</div>}
        </div>
        {status && <ArchiveStamp label={status} />}
      </header>
      <div className="archive-document-body">{children}</div>
    </article>
  );
}

'use client';
import React from 'react';

export function ArchivePhoto({ src, alt, className = '', ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <figure className={`archive-photo ${className}`}><img {...props} src={src} alt={alt} /></figure>;
}

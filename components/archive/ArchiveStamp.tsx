'use client';
import React from 'react';
export function ArchiveStamp({ label, state='known', className='' }: { label:string; state?:string; className?:string }) {
  return <span className={`archive-stamp archive-stamp-${state} ${className}`}>{label}</span>;
}

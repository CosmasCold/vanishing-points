'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useDocumentStore } from '@/state/documentStore';
import { DocumentCanvas } from './DocumentCanvas';

export const DocumentViewer: React.FC = () => {
  const { openDocumentId, getDocumentById, closeDocument } = useDocumentStore();
  const doc = openDocumentId ? getDocumentById(openDocumentId) : undefined;

  return (
    <AnimatePresence>
      {doc && <DocumentCanvas doc={doc} onClose={closeDocument} />}
    </AnimatePresence>
  );
};
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDocumentStore } from '@/state/documentStore';
import { DocumentCanvas } from './DocumentCanvas';
import { colors } from '@/styles/theme';

export const DocumentViewer: React.FC = () => {
  const { openDocumentId, getDocumentById, closeDocument } = useDocumentStore();
  const document = openDocumentId ? getDocumentById(openDocumentId) : undefined;

  return (
    <AnimatePresence>
      {document && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-20"
          style={{ backgroundColor: colors.archive.black }}
        >
          <DocumentCanvas doc={document} onClose={closeDocument} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
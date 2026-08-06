'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { colors, typography } from '@/styles/theme';

interface Props {
  children: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ArchiveErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ARCHIVE ERROR] ${this.props.moduleName || 'Unknown Module'}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full p-8"
          style={{ backgroundColor: colors.archive.black }}
        >
          <div
            className="max-w-md w-full border p-6"
            style={{ borderColor: colors.archive.red, backgroundColor: 'rgba(138, 90, 90, 0.05)' }}
          >
            <div
              style={{
                color: colors.archive.red,
                fontFamily: typography.mono,
                fontSize: typography.sizes.xs,
                letterSpacing: '0.1em',
                marginBottom: '1rem',
              }}
            >
              MODULE FAILURE
            </div>
            <div
              style={{
                color: colors.archive.white,
                fontFamily: typography.mono,
                fontSize: typography.sizes.sm,
                marginBottom: '0.5rem',
              }}
            >
              {this.props.moduleName || 'Unknown subsystem'} has encountered a fatal error.
            </div>
            <div
              style={{
                color: colors.archive.gray,
                fontFamily: typography.mono,
                fontSize: typography.sizes.xs,
                lineHeight: '1.5',
                marginBottom: '1.5rem',
              }}
            >
              The Archive maintains redundant logs. No data has been lost. Attempting to preserve system stability.
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="w-full py-2 border transition-colors hover:border-red-700"
              style={{
                borderColor: colors.archive.red,
                color: colors.archive.red,
                fontFamily: typography.mono,
                fontSize: typography.sizes.xs,
                letterSpacing: '0.05em',
              }}
            >
              ATTEMPT RECOVERY
            </button>
            {this.state.error && (
              <div
                className="mt-4 p-3 border"
                style={{ borderColor: colors.archive.gray, overflow: 'auto' }}
              >
                <pre
                  style={{
                    color: colors.archive.gray,
                    fontFamily: typography.mono,
                    fontSize: '0.625rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {this.state.error.message}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
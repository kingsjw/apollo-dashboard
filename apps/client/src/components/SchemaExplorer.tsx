import { useState } from 'react';
import type { SchemaInfoResponse } from '../api/aiQuery';

interface SchemaExplorerProps {
  schemaInfo: SchemaInfoResponse | null;
}

export function SchemaExplorer({ schemaInfo }: SchemaExplorerProps) {
  const [expanded, setExpanded] = useState(false);

  if (!schemaInfo) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <svg className="h-3.5 w-3.5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
        <span>Loading schema...</span>
      </div>
    );
  }

  const { analysis } = schemaInfo;
  const queries = analysis.entryPoints.filter((e) => e.type === 'query');
  const mutations = analysis.entryPoints.filter((e) => e.type === 'mutation');
  const types = analysis.types;

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-gray-800/30"
      >
        <div className="flex items-center gap-2">
          <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
          <span className="font-medium text-gray-300">Schema</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500">
            {queries.length} queries &middot; {mutations.length} mutations &middot; {types.length} types
          </span>
          <svg
            className={`h-3.5 w-3.5 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-800 px-3 py-2">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h4 className="mb-1.5 font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: '10px' }}>
                Queries
              </h4>
              <ul className="space-y-0.5">
                {queries.map((q) => (
                  <li key={q.name} className="font-mono text-emerald-400">{q.name}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-1.5 font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: '10px' }}>
                Mutations
              </h4>
              <ul className="space-y-0.5">
                {mutations.map((m) => (
                  <li key={m.name} className="font-mono text-amber-400">{m.name}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-1.5 font-medium text-gray-400 uppercase tracking-wider" style={{ fontSize: '10px' }}>
                Types
              </h4>
              <ul className="space-y-0.5">
                {types.map((t) => (
                  <li key={t.name} className="font-mono text-blue-400">{t.name}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

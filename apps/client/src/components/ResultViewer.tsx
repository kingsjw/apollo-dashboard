import { useState } from 'react';
import { JsonView, darkStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import type { QueryStep } from '@apollo-dashboard/shared';
import { QueryPreview } from './QueryPreview';
import { ValidationStatus } from './ValidationStatus';

interface ResultViewerProps {
  result: unknown;
  error: string | null;
  steps?: QueryStep[];
}

function SingleResult({ result, error }: { result: unknown; error: string | null }) {
  if (error) {
    return (
      <div className="rounded-lg border border-red-800 bg-red-900/20 p-4">
        <p className="text-sm font-medium text-red-400">Error</p>
        <p className="mt-1 text-sm text-red-300 font-mono">{error}</p>
      </div>
    );
  }

  if (result === undefined || result === null) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <p className="text-sm text-gray-600 font-mono">
          Query results will appear here...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-800 overflow-hidden">
      <div className="border-b border-gray-800 bg-gray-900 px-4 py-2">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Result
        </span>
      </div>
      <div className="bg-gray-900 p-4 text-sm font-mono overflow-auto max-h-96">
        <JsonView data={result as object} style={darkStyles} />
      </div>
    </div>
  );
}

function StepView({ step, index }: { step: QueryStep; index: number }) {
  const [expanded, setExpanded] = useState(true);
  const label = index === 0 ? 'Primary Query' : `Follow-up Query ${index}`;

  return (
    <div className="rounded-lg border border-gray-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2.5 text-left transition-colors hover:bg-gray-800/80"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-[10px] font-bold text-gray-400">
            {index + 1}
          </span>
          <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">
            {label}
          </span>
          <ValidationStatus
            status={step.validationStatus}
            retryCount={step.retryCount}
          />
        </div>
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="flex flex-col gap-3 bg-gray-950/50 p-4">
          <QueryPreview query={step.query} />
          {step.error ? (
            <div className="rounded-lg border border-red-800 bg-red-900/20 p-3">
              <p className="text-xs font-medium text-red-400">Error</p>
              <p className="mt-1 text-xs text-red-300 font-mono">{step.error}</p>
            </div>
          ) : step.result !== undefined && step.result !== null ? (
            <div className="rounded-lg border border-gray-800 overflow-hidden">
              <div className="border-b border-gray-800 bg-gray-900 px-4 py-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Result
                </span>
              </div>
              <div className="bg-gray-900 p-4 text-sm font-mono overflow-auto max-h-64">
                <JsonView data={step.result as object} style={darkStyles} />
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function ResultViewer({ result, error, steps }: ResultViewerProps) {
  // Multi-step display
  if (steps && steps.length > 1) {
    return (
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {steps.length} execution steps
        </span>
        {steps.map((step, idx) => (
          <StepView key={idx} step={step} index={idx} />
        ))}
      </div>
    );
  }

  // Single result (backward compat)
  return <SingleResult result={result} error={error} />;
}

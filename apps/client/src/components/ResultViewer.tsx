import { JsonView, darkStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

interface ResultViewerProps {
  result: unknown;
  error: string | null;
  message?: string | null;
}

function OutOfScopeMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-purple-800 bg-purple-900/20 p-4">
      <div className="flex items-center gap-2 mb-2">
        <svg className="h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-sm font-medium text-purple-400">Out of Scope</p>
      </div>
      <p className="text-sm text-purple-300">{message}</p>
    </div>
  );
}

export function ResultViewer({ result, error, message }: ResultViewerProps) {
  if (message) {
    return <OutOfScopeMessage message={message} />;
  }

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

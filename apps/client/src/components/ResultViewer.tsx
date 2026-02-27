import { JsonView, darkStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

interface ResultViewerProps {
  result: unknown;
  error: string | null;
}

export function ResultViewer({ result, error }: ResultViewerProps) {
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

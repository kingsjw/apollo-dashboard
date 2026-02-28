import { useState, useCallback } from 'react';
import {
  connectEndpoint,
  disconnectEndpoint,
  type ConnectEndpointResponse,
} from '../api/aiQuery';

interface HeaderEntry {
  key: string;
  value: string;
}

export interface EndpointState {
  connected: boolean;
  endpoint: string | null;
  analysis: ConnectEndpointResponse['analysis'] | null;
}

interface EndpointConnectorProps {
  state: EndpointState;
  onStateChange: (state: EndpointState) => void;
}

export function EndpointConnector({ state, onStateChange }: EndpointConnectorProps) {
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<HeaderEntry[]>([]);
  const [showHeaders, setShowHeaders] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      const headerMap: Record<string, string> = {};
      for (const h of headers) {
        if (h.key.trim() && h.value.trim()) {
          headerMap[h.key.trim()] = h.value.trim();
        }
      }
      const res = await connectEndpoint(
        trimmed,
        Object.keys(headerMap).length > 0 ? headerMap : undefined,
      );
      onStateChange({
        connected: true,
        endpoint: trimmed,
        analysis: res.analysis,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  }, [url, headers, onStateChange]);

  const handleDisconnect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await disconnectEndpoint();
      onStateChange({ connected: false, endpoint: null, analysis: null });
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
    } finally {
      setLoading(false);
    }
  }, [onStateChange]);

  const addHeader = () => {
    setHeaders((prev) => [...prev, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    setHeaders((prev) => prev.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: 'key' | 'value', val: string) => {
    setHeaders((prev) =>
      prev.map((h, i) => (i === index ? { ...h, [field]: val } : h)),
    );
  };

  // Connected state
  if (state.connected) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
            <span className="text-sm text-gray-300 truncate font-mono">
              {state.endpoint}
            </span>
            {state.analysis && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                <span>{state.analysis.types} types</span>
                <span className="text-gray-700">|</span>
                <span>{state.analysis.queries} queries</span>
                <span className="text-gray-700">|</span>
                <span>{state.analysis.mutations} mutations</span>
              </div>
            )}
          </div>
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="shrink-0 rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white disabled:opacity-50"
          >
            {loading ? 'Disconnecting...' : 'Disconnect'}
          </button>
        </div>
      </div>
    );
  }

  // Disconnected state — show input form
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3">
      <div className="flex flex-col gap-3">
        {/* URL input row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-gray-600" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Connect external GraphQL endpoint..."
              className="w-full rounded-md border border-gray-800 bg-gray-900 px-3 py-1.5 text-sm font-mono text-gray-100 placeholder-gray-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConnect();
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowHeaders(!showHeaders)}
              className="rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-200"
              title="Toggle auth headers"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </button>
            <button
              onClick={handleConnect}
              disabled={loading || !url.trim()}
              className="rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </div>

        {/* Optional headers section */}
        {showHeaders && (
          <div className="flex flex-col gap-2 border-t border-gray-800 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Headers
              </span>
              <button
                type="button"
                onClick={addHeader}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                + Add header
              </button>
            </div>
            {headers.map((header, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => updateHeader(idx, 'key', e.target.value)}
                  placeholder="Header name"
                  className="flex-1 rounded-md border border-gray-800 bg-gray-900 px-2.5 py-1 text-xs font-mono text-gray-100 placeholder-gray-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => updateHeader(idx, 'value', e.target.value)}
                  placeholder="Value"
                  className="flex-1 rounded-md border border-gray-800 bg-gray-900 px-2.5 py-1 text-xs font-mono text-gray-100 placeholder-gray-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => removeHeader(idx)}
                  className="text-gray-600 hover:text-red-400 transition-colors text-xs"
                  title="Remove header"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {headers.length === 0 && (
              <p className="text-xs text-gray-600">No headers configured. Click &quot;+ Add header&quot; to add authorization headers.</p>
            )}
          </div>
        )}

        {/* Error display */}
        {error && (
          <p className="text-xs text-red-400 font-mono">{error}</p>
        )}
      </div>
    </div>
  );
}

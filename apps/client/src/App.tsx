import { useState } from 'react';
import { QueryInput } from './components/QueryInput';
import { QueryPreview } from './components/QueryPreview';
import { ValidationStatus } from './components/ValidationStatus';
import { ResultViewer } from './components/ResultViewer';
import { EndpointConnector, type EndpointState } from './components/EndpointConnector';
import { useAIQuery } from './hooks/useAIQuery';

function App() {
  const { data, loading, error, execute } = useAIQuery();
  const [endpointState, setEndpointState] = useState<EndpointState>({
    connected: false,
    endpoint: null,
    analysis: null,
  });

  const hasMultipleSteps = data?.steps && data.steps.length > 1;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Apollo Dashboard</h1>
            <span className="rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
              AI-powered GraphQL
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          {/* Endpoint Connector */}
          <EndpointConnector
            state={endpointState}
            onStateChange={setEndpointState}
          />

          {/* Schema info bar */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
            <span>
              Schema:{' '}
              <span className="text-gray-400">
                {endpointState.connected
                  ? endpointState.endpoint
                  : 'Built-in e-commerce schema'}
              </span>
            </span>
          </div>

          {/* Two-panel layout */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Panel: Input */}
            <section className="rounded-lg border border-gray-800 bg-gray-900/50 p-5">
              <QueryInput onSubmit={execute} loading={loading} />
            </section>

            {/* Right Panel: Results */}
            <section className="flex flex-col gap-4">
              {/* Primary query output — validation status + query preview */}
              {!hasMultipleSteps && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                      Output
                    </span>
                    <ValidationStatus
                      status={data?.validationStatus ?? null}
                      retryCount={data?.retryCount ?? 0}
                    />
                  </div>
                  <QueryPreview query={data?.query ?? null} />
                </div>
              )}

              {/* Result Viewer — handles both single and multi-step */}
              <ResultViewer
                result={data?.result}
                error={error ?? data?.error ?? null}
                steps={data?.steps}
              />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

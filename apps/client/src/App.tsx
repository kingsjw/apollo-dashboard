import { QueryInput } from './components/QueryInput';
import { QueryPreview } from './components/QueryPreview';
import { ValidationStatus } from './components/ValidationStatus';
import { ResultViewer } from './components/ResultViewer';
import { useAIQuery } from './hooks/useAIQuery';

function App() {
  const { data, loading, error, execute } = useAIQuery();

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
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Panel: Input */}
          <section className="rounded-lg border border-gray-800 bg-gray-900/50 p-5">
            <QueryInput onSubmit={execute} loading={loading} />
          </section>

          {/* Right Panel: Results */}
          <section className="flex flex-col gap-4">
            {/* Validation Status + Query Preview */}
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

            {/* Result Viewer */}
            <ResultViewer
              result={data?.result}
              error={error ?? data?.error ?? null}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;

import { useState } from 'react';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  loading: boolean;
  exampleQueries?: Array<{ text: string; category: string }>;
}

export function QueryInput({ onSubmit, loading, exampleQueries }: QueryInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="query-input" className="text-sm font-medium text-gray-400 uppercase tracking-wide">
        Natural Language Query
      </label>
      <textarea
        id="query-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Describe the data you want to query..."
        rows={5}
        className="w-full resize-y rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 font-mono text-sm text-gray-100 placeholder-gray-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
        disabled={loading}
      />
      {exampleQueries && exampleQueries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {exampleQueries.map((eq) => (
            <button
              key={eq.text}
              type="button"
              onClick={() => setValue(eq.text)}
              className="rounded-full border border-gray-700 bg-gray-800/50 px-3 py-1 text-xs text-gray-400 transition-colors hover:border-emerald-600 hover:text-emerald-400"
            >
              {eq.text}
            </button>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="self-start rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating...
          </>
        ) : (
          'Generate Query'
        )}
      </button>
    </form>
  );
}

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface QueryPreviewProps {
  query: string | null;
}

export function QueryPreview({ query }: QueryPreviewProps) {
  if (!query) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <p className="text-sm text-gray-600 font-mono">
          Generated GraphQL query will appear here...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Generated Query
        </span>
      </div>
      <SyntaxHighlighter
        language="graphql"
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.875rem',
          padding: '1rem',
        }}
      >
        {query}
      </SyntaxHighlighter>
    </div>
  );
}

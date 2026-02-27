import type { AIQueryRequest } from '@apollo-dashboard/shared';

function App() {
  // Demonstrate shared type is importable
  const _request: AIQueryRequest = { naturalLanguage: '' };

  return (
    <div>
      <h1>Apollo Dashboard</h1>
      <p>Schema-aware AI-powered GraphQL Query Dashboard</p>
    </div>
  );
}

export default App;

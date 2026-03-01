import { useState, useEffect } from 'react';
import { fetchSchemaInfo, type SchemaInfoResponse } from '../api/aiQuery';

export function useSchemaInfo() {
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfoResponse | null>(null);

  useEffect(() => {
    fetchSchemaInfo()
      .then(setSchemaInfo)
      .catch((err) => console.error('Failed to fetch schema info:', err));
  }, []);

  return schemaInfo;
}

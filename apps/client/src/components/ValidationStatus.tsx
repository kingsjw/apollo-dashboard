interface ValidationStatusProps {
  status: 'valid' | 'invalid' | 'corrected' | 'out_of_scope' | null;
  retryCount: number;
}

const badgeStyles = {
  valid: 'bg-emerald-900/50 text-emerald-400 border-emerald-800',
  corrected: 'bg-amber-900/50 text-amber-400 border-amber-800',
  invalid: 'bg-red-900/50 text-red-400 border-red-800',
  out_of_scope: 'bg-purple-900/50 text-purple-400 border-purple-800',
} as const;

const badgeLabels = {
  valid: 'Valid',
  corrected: 'Corrected',
  invalid: 'Invalid',
  out_of_scope: 'Out of Scope',
} as const;

const dotColors = {
  valid: 'bg-emerald-400',
  corrected: 'bg-amber-400',
  invalid: 'bg-red-400',
  out_of_scope: 'bg-purple-400',
} as const;

export function ValidationStatus({ status, retryCount }: ValidationStatusProps) {
  if (!status) return null;

  const label =
    status === 'corrected'
      ? `${badgeLabels[status]} (${retryCount} ${retryCount === 1 ? 'retry' : 'retries'})`
      : badgeLabels[status];

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${badgeStyles[status]}`}
    >
      <span
        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${dotColors[status]}`}
      />
      {label}
    </span>
  );
}

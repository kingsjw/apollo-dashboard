interface ValidationStatusProps {
  status: 'valid' | 'invalid' | 'corrected' | null;
  retryCount: number;
}

const badgeStyles = {
  valid: 'bg-emerald-900/50 text-emerald-400 border-emerald-800',
  corrected: 'bg-amber-900/50 text-amber-400 border-amber-800',
  invalid: 'bg-red-900/50 text-red-400 border-red-800',
} as const;

const badgeLabels = {
  valid: 'Valid',
  corrected: 'Corrected',
  invalid: 'Invalid',
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
        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
          status === 'valid'
            ? 'bg-emerald-400'
            : status === 'corrected'
              ? 'bg-amber-400'
              : 'bg-red-400'
        }`}
      />
      {label}
    </span>
  );
}

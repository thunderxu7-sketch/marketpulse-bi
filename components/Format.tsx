export function formatUsd(value: number, digits = 1) {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(digits)}B`;
  if (absolute >= 1_000_000) return `$${(value / 1_000_000).toFixed(digits)}M`;
  if (absolute >= 1_000) return `$${(value / 1_000).toFixed(digits)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

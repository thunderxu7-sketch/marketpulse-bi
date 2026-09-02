export function formatUsd(value: number, digits = 1) {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(digits)}B`;
  if (absolute >= 1_000_000) return `$${(value / 1_000_000).toFixed(digits)}M`;
  if (absolute >= 1_000) return `$${(value / 1_000).toFixed(digits)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatTime(value: string, locale = 'en-US') {
  return new Date(value).toLocaleString(locale, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export function formatDate(value: string, locale = 'en-US') {
  return new Date(value).toLocaleDateString(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

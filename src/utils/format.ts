export function formatNumber(value: number | string | undefined | null): string {
  const num = Number(value || 0);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Math.round(num));
}

export function formatShortMillions(value: number): string {
  if (value >= 1_000_000) {
    const tr = value / 1_000_000;
    return `${tr.toFixed(1).replace(/\.0$/, '')} tr`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}k`;
  }
  return String(value);
}

export function parseSmartNumber(raw: any): number {
  if (raw === null || raw === undefined || raw === '') return 0;
  if (typeof raw === 'number') return isNaN(raw) ? 0 : raw;
  const str = String(raw).trim();
  if (!str) return 0;
  // Remove currency symbols and spaces
  const cleaned = str.replace(/[^\d.,-]/g, '');
  if (!cleaned) return 0;

  // Handle cases like "1,000,000" or "1.000.000"
  const dots = (cleaned.match(/\./g) || []).length;
  const commas = (cleaned.match(/,/g) || []).length;

  if (dots > 1 && commas === 0) {
    return Number(cleaned.replace(/\./g, '')) || 0;
  }
  if (commas > 1 && dots === 0) {
    return Number(cleaned.replace(/,/g, '')) || 0;
  }
  if (dots === 1 && commas === 0) {
    const parts = cleaned.split('.');
    if (parts[1] && parts[1].length === 3) {
      return Number(cleaned.replace(/\./g, '')) || 0;
    }
  }
  return Number(cleaned.replace(/,/g, '')) || 0;
}

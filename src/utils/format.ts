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
  const cleaned = str.replace(/[^\d.,-]/g, '');
  if (!cleaned) return 0;

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

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function readTriple(n: number, showZeroHundred: boolean): string {
  const hundred = Math.floor(n / 100);
  const ten = Math.floor((n % 100) / 10);
  const unit = n % 10;
  let res = '';

  if (hundred > 0 || showZeroHundred) {
    res += DIGITS[hundred] + ' trăm';
    if (ten === 0 && unit > 0) {
      res += ' linh';
    }
  }

  if (ten > 1) {
    res += (res ? ' ' : '') + DIGITS[ten] + ' mươi';
    if (unit === 1) res += ' mốt';
    else if (unit === 4) res += ' tư';
    else if (unit === 5) res += ' lăm';
    else if (unit > 0) res += ' ' + DIGITS[unit];
  } else if (ten === 1) {
    res += (res ? ' ' : '') + 'mười';
    if (unit === 5) res += ' lăm';
    else if (unit > 0) res += ' ' + DIGITS[unit];
  } else if (ten === 0 && unit > 0) {
    res += (res ? ' ' : '') + DIGITS[unit];
  }

  return res.trim();
}

export function numberToVietnameseWords(amount: number): string {
  const num = Math.round(Math.abs(amount || 0));
  if (num === 0) return 'Không đồng';

  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ'];
  const groups: number[] = [];
  let temp = num;
  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g > 0) {
      const showZeroHundred = i < groups.length - 1;
      const text = readTriple(g, showZeroHundred);
      parts.push(text + (units[i] ? ' ' + units[i] : ''));
    }
  }

  const sentence = parts.join(' ').trim();
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ' đồng chẵn.';
}

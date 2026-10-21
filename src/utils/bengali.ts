export const bnDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
export const engDigits: Record<string, string> = {'0':'০', '1':'১', '2':'২', '3':'৩', '4':'৪', '5':'৫', '6':'৬', '7':'৭', '8':'৮', '9':'৯'};
export const bnToEngMap: Record<string, string> = {'০':'0', '১':'1', '২':'2', '৩':'3', '৪':'4', '৫':'5', '৬':'6', '৭':'7', '৮':'8', '৯':'9'};

export function toBnNum(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === '') return '০';
  return num.toString().replace(/\d/g, d => bnDigits[parseInt(d, 10)]);
}

export function toEngNum(str: string | null | undefined): string {
  if (!str) return '0';
  return str.toString().replace(/[০-৯]/g, d => bnToEngMap[d] || d);
}

export function parseBnFloat(str: string | null | undefined): number {
  if (!str) return 0;
  const eng = toEngNum(str).replace(/[^\d.]/g, '');
  return parseFloat(eng) || 0;
}

export function cleanBnInput(val: string): string {
  return val.replace(/\d/g, d => bnDigits[parseInt(d, 10)]);
}

export function formatWeightKgGm(weightInKg: number): string {
  if (!weightInKg || weightInKg <= 0) return '০ কেজি';
  const totalGm = Math.round(weightInKg * 1000);
  const kg = Math.floor(totalGm / 1000);
  const gm = totalGm % 1000;
  const parts: string[] = [];
  if (kg > 0) parts.push(toBnNum(kg) + ' কেজি');
  if (gm > 0) parts.push(toBnNum(gm) + ' গ্রাম');
  return parts.length > 0 ? parts.join(' ') : '০ কেজি';
}

export function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatBnDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return toBnNum(dt.toLocaleDateString('bn-BD', options));
}

export function formatBnDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return toBnNum(dt.toLocaleDateString('bn-BD', options));
}

export function formatBnTime(dt: Date): string {
  let h = dt.getHours();
  const m = dt.getMinutes();
  const ampm = h >= 12 ? 'বিকাল' : (h >= 6 ? 'সকাল' : 'ভোর');
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${ampm} ${toBnNum(h)}:${toBnNum(m.toString().padStart(2, '0'))}`;
}

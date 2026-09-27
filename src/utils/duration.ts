import { Complaint } from '../types';

export interface SLAEvaluation {
  code: 'fast' | 'standard' | 'extended';
  label: string;
  badgeClass: string;
  dotClass: string;
  status: string;
  color: string;
  colorClass: string;
}

/**
 * Calculates human-readable elapsed duration between two ISO dates.
 */
export function calculateResolutionDuration(
  startIso?: string,
  endIso?: string,
  isAr = true
): { formatted: string; hours: number; totalHours: number; days: number; minutes: number } {
  if (!startIso) {
    return { formatted: isAr ? 'غير محدد' : 'N/A', hours: 0, totalHours: 0, days: 0, minutes: 0 };
  }

  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;
  const remainingMinutes = totalMinutes % 60;

  let formatted = '';

  if (days > 0) {
    if (isAr) {
      formatted = `${days} ${days === 1 ? 'يوم' : days === 2 ? 'يومان' : 'أيام'}${
        remainingHours > 0 ? ` و ${remainingHours} ساعة` : ''
      }`;
    } else {
      formatted = `${days}d ${remainingHours > 0 ? `${remainingHours}h` : ''}`.trim();
    }
  } else if (totalHours > 0) {
    if (isAr) {
      formatted = `${totalHours} ${totalHours === 1 ? 'ساعة' : totalHours === 2 ? 'ساعتان' : 'ساعات'}${
        remainingMinutes > 0 ? ` و ${remainingMinutes} دقيقة` : ''
      }`;
    } else {
      formatted = `${totalHours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`.trim();
    }
  } else {
    const mins = Math.max(1, remainingMinutes);
    if (isAr) {
      formatted = `${mins} ${mins === 1 ? 'دقيقة' : mins === 2 ? 'دقيقتان' : 'دقائق'}`;
    } else {
      formatted = `${mins}m`;
    }
  }

  return {
    formatted,
    hours: totalHours,
    totalHours,
    days,
    minutes: totalMinutes,
  };
}

export function evaluateSLA(
  hoursOrStart: number | string,
  isArOrEnd?: boolean | string,
  maybeIsAr?: boolean
): SLAEvaluation {
  let hours = 0;
  let isAr = true;

  if (typeof hoursOrStart === 'number') {
    hours = hoursOrStart;
    if (typeof isArOrEnd === 'boolean') {
      isAr = isArOrEnd;
    }
  } else if (typeof hoursOrStart === 'string') {
    const start = new Date(hoursOrStart).getTime();
    const end = typeof isArOrEnd === 'string' ? new Date(isArOrEnd).getTime() : Date.now();
    hours = Math.max(0, (end - start) / (1000 * 60 * 60));
    if (typeof maybeIsAr === 'boolean') {
      isAr = maybeIsAr;
    }
  }

  if (hours <= 24) {
    const label = isAr ? 'استجابة فائقة (أقل من 24 ساعة)' : 'Rapid (<24h)';
    const cls = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    return {
      code: 'fast',
      label,
      badgeClass: cls,
      dotClass: 'bg-emerald-400',
      status: label,
      color: cls,
      colorClass: cls,
    };
  }
  if (hours <= 72) {
    const label = isAr ? 'معدل اعتيادي (24-72 ساعة)' : 'Standard (24-72h)';
    const cls = 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
    return {
      code: 'standard',
      label,
      badgeClass: cls,
      dotClass: 'bg-sky-400',
      status: label,
      color: cls,
      colorClass: cls,
    };
  }
  const label = isAr ? 'معالجة ممتدة (>72 ساعة)' : 'Extended (>72h)';
  const cls = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
  return {
    code: 'extended',
    label,
    badgeClass: cls,
    dotClass: 'bg-amber-400',
    status: label,
    color: cls,
    colorClass: cls,
  };
}

export function computeAverageResolutionHours(complaints: Complaint[]): {
  avgHours: number;
  fastestHours: number;
  resolvedCount: number;
} {
  const resolved = complaints.filter(c => c.status === 'resolved' || c.status === 'closed');
  if (resolved.length === 0) {
    return { avgHours: 0, fastestHours: 0, resolvedCount: 0 };
  }

  let totalHours = 0;
  let fastest = Number.MAX_SAFE_INTEGER;

  resolved.forEach(c => {
    const start = new Date(c.submittedAt).getTime();
    const end = c.resolvedAt ? new Date(c.resolvedAt).getTime() : Date.now();
    const hours = Math.max(0.1, (end - start) / (1000 * 60 * 60));
    totalHours += hours;
    if (hours < fastest) fastest = hours;
  });

  return {
    avgHours: Number((totalHours / resolved.length).toFixed(1)),
    fastestHours: fastest === Number.MAX_SAFE_INTEGER ? 0 : Number(fastest.toFixed(1)),
    resolvedCount: resolved.length,
  };
}

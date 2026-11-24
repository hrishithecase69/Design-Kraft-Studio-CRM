import type { RegionCode } from '../types/crm';

export interface TimezonePreset {
  id: string;
  label: string;
  city: string;
  region: RegionCode;
  timeZone: string;
  shortCode: string;
}

export const PROSPECT_TIMEZONE_PRESETS: TimezonePreset[] = [
  { id: 'us-ny', label: 'New York (US East)', city: 'New York, NY', region: 'US', timeZone: 'America/New_York', shortCode: 'ET' },
  { id: 'us-chi', label: 'Austin / Chicago (US Central)', city: 'Austin, TX', region: 'US', timeZone: 'America/Chicago', shortCode: 'CT' },
  { id: 'us-sf', label: 'San Francisco (US West)', city: 'San Francisco, CA', region: 'US', timeZone: 'America/Los_Angeles', shortCode: 'PT' },
  { id: 'uk-lon', label: 'London (UK)', city: 'London', region: 'UK', timeZone: 'Europe/London', shortCode: 'UK' },
  { id: 'ca-tor', label: 'Toronto (Canada East)', city: 'Toronto, ON', region: 'Canada', timeZone: 'America/Toronto', shortCode: 'ET' },
  { id: 'ca-van', label: 'Vancouver (Canada West)', city: 'Vancouver, BC', region: 'Canada', timeZone: 'America/Vancouver', shortCode: 'PT' },
  { id: 'au-syd', label: 'Sydney (Australia)', city: 'Sydney, NSW', region: 'Australia', timeZone: 'Australia/Sydney', shortCode: 'AET' },
  { id: 'au-mel', label: 'Melbourne (Australia)', city: 'Melbourne, VIC', region: 'Australia', timeZone: 'Australia/Melbourne', shortCode: 'AET' },
];

export interface LocalTimeInfo {
  time12: string;
  time24: string;
  timeWithSeconds: string;
  tzShort: string;
  dayShort: string;
  hour24: number;
  minute: number;
  isInCallingWindow: boolean; // 9:00 AM - 6:00 PM local time (09:00 <= t < 18:00)
  isWeekend: boolean;
  windowLabel: string;
  offsetFromIST: string;
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }
  const hour = Number(map.hour) === 24 ? 0 : Number(map.hour);
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    hour,
    Number(map.minute),
    Number(map.second)
  );
  return Math.round((asUtc - date.getTime()) / 60000);
}

export function getLocalTimeInfo(timeZone: string, now: Date): LocalTimeInfo {
  const partsFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  });

  const parts = partsFormatter.formatToParts(now);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

  const rawHour = Number(getPart('hour'));
  const hour24 = rawHour === 24 ? 0 : rawHour;
  const minute = Number(getPart('minute'));
  const dayShort = getPart('weekday');
  const tzShort = getPart('timeZoneName');

  const time12 = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(now);

  const time24 = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  const timeWithSeconds = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now);

  const isWeekend = dayShort === 'Sat' || dayShort === 'Sun';
  const isInCallingWindow = hour24 >= 9 && hour24 < 18;

  let windowLabel = 'After Hours';
  if (isInCallingWindow) {
    windowLabel = isWeekend ? '9–6 Window (Wknd)' : 'In Calling Window';
  } else if (hour24 >= 7 && hour24 < 9) {
    windowLabel = 'Opens Soon';
  }

  // Offset relative to IST (UTC+5:30 = +330 mins)
  const targetOffset = getTimeZoneOffsetMinutes(now, timeZone);
  const istOffset = 330;
  const diffMins = targetOffset - istOffset;
  const sign = diffMins >= 0 ? '+' : '-';
  const absMins = Math.abs(diffMins);
  const diffHrs = Math.floor(absMins / 60);
  const remMins = absMins % 60;
  const offsetFromIST =
    remMins === 0 ? `${sign}${diffHrs}h vs IST` : `${sign}${diffHrs}h ${remMins}m vs IST`;

  return {
    time12,
    time24,
    timeWithSeconds,
    tzShort,
    dayShort,
    hour24,
    minute,
    isInCallingWindow,
    isWeekend,
    windowLabel,
    offsetFromIST,
  };
}

export function getISTClock(now: Date): { time: string; date: string } {
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now);

  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(now);

  return { time, date };
}

export function formatRelativeTimestamp(iso: string | null): string {
  if (!iso) return 'Not contacted';
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 14) return `${diffDay}d ago`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

export function formatActivityDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

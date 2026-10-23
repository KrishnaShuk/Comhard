const DAY_MS = 24 * 60 * 60 * 1000;

interface DateKeyParts {
  year: number;
  month: number;
  day: number;
}

export function parseDateKey(value: string): DateKeyParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function isDateKey(value: string): boolean {
  return parseDateKey(value) !== null;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function getTimeZoneOffsetMs(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = new Map(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.get("year")),
    Number(values.get("month")) - 1,
    Number(values.get("day")),
    Number(values.get("hour")),
    Number(values.get("minute")),
    Number(values.get("second")),
  );

  return asUtc - (date.getTime() - (date.getTime() % 1000));
}

export function zonedStartOfDay(dateKey: string, timeZone: string): Date {
  const parts = parseDateKey(dateKey);
  if (!parts) throw new Error(`Invalid date key: ${dateKey}`);

  const utcGuess = Date.UTC(parts.year, parts.month - 1, parts.day);
  const firstOffset = getTimeZoneOffsetMs(timeZone, new Date(utcGuess));
  const firstGuess = utcGuess - firstOffset;
  const secondOffset = getTimeZoneOffsetMs(timeZone, new Date(firstGuess));

  return new Date(utcGuess - secondOffset);
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const parts = parseDateKey(dateKey);
  if (!parts) throw new Error(`Invalid date key: ${dateKey}`);

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days))
    .toISOString()
    .slice(0, 10);
}

export function getDateKeyInTz(
  date: Date | string,
  timeZone: string,
): string {
  const instant = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("year")}-${values.get("month")}-${values.get("day")}`;
}

export function getTodayInTz(
  timeZone: string,
  now: Date = new Date(),
): string {
  return getDateKeyInTz(now, timeZone);
}

export function eachDateKey(from: string, to: string): string[] {
  if (!isDateKey(from) || !isDateKey(to) || from > to) return [];
  const keys: string[] = [];
  let current = from;

  while (current <= to && keys.length < 400) {
    keys.push(current);
    current = addDaysToDateKey(current, 1);
  }

  return keys;
}

export function rangeDayCount(from: string, to: string): number {
  const fromParts = parseDateKey(from);
  const toParts = parseDateKey(to);
  if (!fromParts || !toParts) return 0;

  const start = Date.UTC(fromParts.year, fromParts.month - 1, fromParts.day);
  const end = Date.UTC(toParts.year, toParts.month - 1, toParts.day);
  return Math.floor((end - start) / DAY_MS) + 1;
}

import NepaliDate from "nepali-date-converter";

/** A Bikram Sambat date with a 1-based month (1 = Baishakh, 12 = Chaitra). */
export type BsParts = { year: number; month: number; day: number };

/** A BS year+month, used for monthly grouping/queries. */
export type BsMonth = { year: number; month: number };

const NEPALI_MONTHS = [
  "Baishakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
] as const;

/** Convert a Gregorian Date to BS parts (month 1-based). */
export function adToBs(date: Date): BsParts {
  const nd = new NepaliDate(date);
  return { year: nd.getYear(), month: nd.getMonth() + 1, day: nd.getDate() };
}

/** Convert BS parts (month 1-based) to a Gregorian Date (local midnight). */
export function bsToAd({ year, month, day }: BsParts): Date {
  return new NepaliDate(year, month - 1, day).toJsDate();
}

/** Today's BS date. */
export function currentBs(): BsParts {
  return adToBs(new Date());
}

/** Today's BS year+month. */
export function currentBsMonth(): BsMonth {
  const { year, month } = currentBs();
  return { year, month };
}

/** Parse a Gregorian "YYYY-MM-DD" (from a date input) into BS parts. */
export function adStringToBs(adDate: string): BsParts {
  const [y, m, d] = adDate.split("-").map(Number);
  return adToBs(new Date(y, m - 1, d));
}

/** Format a Gregorian Date as "YYYY-MM-DD" for a date input's value. */
export function toAdInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Month name for a 1-based BS month. */
export function bsMonthName(month: number): string {
  return NEPALI_MONTHS[month - 1] ?? String(month);
}

/** Human BS date, e.g. "10 Ashadh 2083". */
export function formatBs({ year, month, day }: BsParts): string {
  return `${day} ${bsMonthName(month)} ${year}`;
}

/** Human BS month, e.g. "Ashadh 2083". */
export function formatBsMonth({ year, month }: BsMonth): string {
  return `${bsMonthName(month)} ${year}`;
}

// The package ships .d.ts files but doesn't declare `types` in package.json,
// so under bundler resolution TS can't auto-find them. Declare the surface we use.
declare module "nepali-date-converter" {
  export default class NepaliDate {
    constructor();
    constructor(date: Date | number);
    /** BS calendar parts; month is 0-indexed (0 = Baishakh). */
    constructor(year: number, month: number, day: number);
    /** BS year, e.g. 2083. */
    getYear(): number;
    /** BS month, 0-indexed (0 = Baishakh, 11 = Chaitra). */
    getMonth(): number;
    /** BS day of month, 1-based. */
    getDate(): number;
    format(format: string): string;
    toJsDate(): Date;
  }
}

const MIN_YEAR = 0
const MAX_YEAR = 9999
const DAYS_PER_400_YEARS = 146097

export type DateOverflow = "constrain" | "reject"

export interface LocalDateFields {
  year?: number
  month?: number
  day?: number
}

export interface LocalDateDuration {
  years?: number
  months?: number
  weeks?: number
  days?: number
}

export interface LocalDateOptions {
  overflow?: DateOverflow
}

/** Error raised when a LocalDate value or operation is invalid. */
export class LocalDateError extends RangeError {
  public constructor(message: string) {
    super(message)
    this.name = "LocalDateError"
  }
}

/**
 * An immutable proleptic-Gregorian calendar date with no time or timezone.
 *
 * Supported values are 0000-01-01 through 9999-12-31. Internally, a date is
 * stored as an integer count of days from 1970-01-01.
 */
export class LocalDate {
  static readonly MIN = new LocalDate(MIN_YEAR, 1, 1)
  static readonly MAX = new LocalDate(MAX_YEAR, 12, 31)

  readonly #epochDay: number

  public constructor(year: number, month: number, day: number) {
    assertDate(year, month, day)
    this.#epochDay = epochDayFromCivil(year, month, day)
    Object.freeze(this)
  }

  /** Parse an exact ISO 8601 calendar date in YYYY-MM-DD form. */
  public static fromISO(value: string): LocalDate {
    if (typeof value !== "string") {
      throw new TypeError("ISO date must be a string")
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    if (!match) {
      throw new LocalDateError("Invalid ISO date; expected YYYY-MM-DD")
    }

    return new LocalDate(Number(match[1]), Number(match[2]), Number(match[3]))
  }

  /** Construct from a standard epoch day where 1970-01-01 is day 0. */
  public static fromEpochDay(epochDay: number): LocalDate {
    assertInteger(epochDay, "epochDay")
    const fields = civilFromEpochDay(epochDay)
    assertYear(fields.year)
    return LocalDate.#fromValidatedEpochDay(epochDay)
  }

  /** Return today's calendar date in the host's local timezone. */
  public static today(): LocalDate {
    const now = new Date()
    return new LocalDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
  }

  /** Return today's calendar date in UTC. */
  public static todayUTC(): LocalDate {
    const now = new Date()
    return new LocalDate(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate())
  }

  /** Construct from the UTC calendar fields of a JavaScript Date. */
  public static fromDateUTC(value: Date): LocalDate {
    if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
      throw new TypeError("Expected a valid Date")
    }
    return new LocalDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate())
  }

  /** Compare two dates, returning -1, 0, or 1. */
  public static compare(left: LocalDate, right: LocalDate): -1 | 0 | 1 {
    assertLocalDate(left, "left")
    assertLocalDate(right, "right")
    return left.#epochDay < right.#epochDay ? -1 : left.#epochDay > right.#epochDay ? 1 : 0
  }

  static #fromValidatedEpochDay(epochDay: number): LocalDate {
    const fields = civilFromEpochDay(epochDay)
    return new LocalDate(fields.year, fields.month, fields.day)
  }

  public get year(): number {
    return civilFromEpochDay(this.#epochDay).year
  }

  public get month(): number {
    return civilFromEpochDay(this.#epochDay).month
  }

  public get day(): number {
    return civilFromEpochDay(this.#epochDay).day
  }

  /** ISO weekday number: Monday = 1 through Sunday = 7. */
  public get dayOfWeek(): number {
    return floorMod(this.#epochDay + 3, 7) + 1
  }

  /** Day number within the year: January 1 = 1. */
  public get dayOfYear(): number {
    return this.#epochDay - epochDayFromCivil(this.year, 1, 1) + 1
  }

  public get daysInMonth(): number {
    return daysInMonth(this.year, this.month)
  }

  public get daysInYear(): number {
    return isLeapYear(this.year) ? 366 : 365
  }

  public get isLeapYear(): boolean {
    return isLeapYear(this.year)
  }

  public get epochDay(): number {
    return this.#epochDay
  }

  /** Return a copy with selected fields replaced. */
  public with(fields: LocalDateFields, options: LocalDateOptions = {}): LocalDate {
    if (fields === null || typeof fields !== "object") {
      throw new TypeError("fields must be an object")
    }

    const overflow = normalizeOverflow(options.overflow)
    const year = fields.year ?? this.year
    const month = fields.month ?? this.month
    const requestedDay = fields.day ?? this.day

    assertYear(year)
    assertMonth(month)
    assertInteger(requestedDay, "day")

    const lastDay = daysInMonth(year, month)
    if (overflow === "reject" && (requestedDay < 1 || requestedDay > lastDay)) {
      throw new LocalDateError("Resulting date is invalid")
    }

    const day = overflow === "constrain"
      ? clamp(requestedDay, 1, lastDay)
      : requestedDay

    return new LocalDate(year, month, day)
  }

  /** Add calendar years, months, weeks, and days. Month overflow constrains by default. */
  public plus(duration: LocalDateDuration, options: LocalDateOptions = {}): LocalDate {
    const normalized = normalizeDuration(duration)
    const overflow = normalizeOverflow(options.overflow)

    const totalMonths = this.year * 12 + (this.month - 1) + normalized.years * 12 + normalized.months
    const targetYear = floorDiv(totalMonths, 12)
    const targetMonth = floorMod(totalMonths, 12) + 1
    assertYear(targetYear)

    const lastDay = daysInMonth(targetYear, targetMonth)
    if (overflow === "reject" && this.day > lastDay) {
      throw new LocalDateError("Resulting date is invalid")
    }

    const targetDay = Math.min(this.day, lastDay)
    const calendarDate = new LocalDate(targetYear, targetMonth, targetDay)
    const dayDelta = normalized.weeks * 7 + normalized.days
    return dayDelta === 0 ? calendarDate : LocalDate.fromEpochDay(calendarDate.#epochDay + dayDelta)
  }

  public minus(duration: LocalDateDuration, options: LocalDateOptions = {}): LocalDate {
    const normalized = normalizeDuration(duration)
    return this.plus({
      years: -normalized.years,
      months: -normalized.months,
      weeks: -normalized.weeks,
      days: -normalized.days
    }, options)
  }

  public plusDays(days: number): LocalDate {
    return this.plus({ days })
  }

  public plusWeeks(weeks: number): LocalDate {
    return this.plus({ weeks })
  }

  public plusMonths(months: number, options: LocalDateOptions = {}): LocalDate {
    return this.plus({ months }, options)
  }

  public plusYears(years: number, options: LocalDateOptions = {}): LocalDate {
    return this.plus({ years }, options)
  }

  /** Signed whole-day distance from this date to another date. */
  public daysUntil(other: LocalDate): number {
    assertLocalDate(other, "other")
    return other.#epochDay - this.#epochDay
  }

  public equals(other: unknown): other is LocalDate {
    return other instanceof LocalDate && this.#epochDay === other.#epochDay
  }

  public isBefore(other: LocalDate): boolean {
    assertLocalDate(other, "other")
    return this.#epochDay < other.#epochDay
  }

  public isAfter(other: LocalDate): boolean {
    assertLocalDate(other, "other")
    return this.#epochDay > other.#epochDay
  }

  public isBetween(start: LocalDate, end: LocalDate, inclusive = true): boolean {
    assertLocalDate(start, "start")
    assertLocalDate(end, "end")
    if (start.isAfter(end)) {
      throw new LocalDateError("start must not be after end")
    }
    return inclusive
      ? this.#epochDay >= start.#epochDay && this.#epochDay <= end.#epochDay
      : this.#epochDay > start.#epochDay && this.#epochDay < end.#epochDay
  }

  /** Convert to a JavaScript Date at midnight UTC. */
  public toDateUTC(): Date {
    const date = new Date(0)
    date.setUTCHours(0, 0, 0, 0)
    date.setUTCFullYear(this.year, this.month - 1, this.day)
    return date
  }

  public toISO(): string {
    return `${pad4(this.year)}-${pad2(this.month)}-${pad2(this.day)}`
  }

  public toString(): string {
    return this.toISO()
  }

  public toJSON(): string {
    return this.toISO()
  }

  public toLocaleString(
    locales?: Intl.LocalesArgument,
    options: Intl.DateTimeFormatOptions = {}
  ): string {
    return new Intl.DateTimeFormat(locales, {
      timeZone: "UTC",
      ...options
    }).format(this.toDateUTC())
  }

  public valueOf(): number {
    return this.#epochDay
  }

  public [Symbol.toPrimitive](hint: string): string | number {
    return hint === "number" ? this.#epochDay : this.toISO()
  }
}

function normalizeDuration(duration: LocalDateDuration): Required<LocalDateDuration> {
  if (duration === null || typeof duration !== "object") {
    throw new TypeError("duration must be an object")
  }

  const normalized = {
    years: duration.years ?? 0,
    months: duration.months ?? 0,
    weeks: duration.weeks ?? 0,
    days: duration.days ?? 0
  }

  for (const [name, value] of Object.entries(normalized)) {
    assertInteger(value, name)
  }

  return normalized
}

function normalizeOverflow(value: DateOverflow | undefined): DateOverflow {
  if (value === undefined) return "constrain"
  if (value !== "constrain" && value !== "reject") {
    throw new LocalDateError('overflow must be "constrain" or "reject"')
  }
  return value
}

function assertLocalDate(value: unknown, name: string): asserts value is LocalDate {
  if (!(value instanceof LocalDate)) {
    throw new TypeError(`${name} must be a LocalDate`)
  }
}

function assertDate(year: number, month: number, day: number): void {
  assertYear(year)
  assertMonth(month)
  assertInteger(day, "day")
  const lastDay = daysInMonth(year, month)
  if (day < 1 || day > lastDay) {
    throw new LocalDateError(`day must be between 1 and ${lastDay}`)
  }
}

function assertYear(year: number): void {
  assertInteger(year, "year")
  if (year < MIN_YEAR || year > MAX_YEAR) {
    throw new LocalDateError(`year must be between ${MIN_YEAR} and ${MAX_YEAR}`)
  }
}

function assertMonth(month: number): void {
  assertInteger(month, "month")
  if (month < 1 || month > 12) {
    throw new LocalDateError("month must be between 1 and 12")
  }
}

function assertInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new LocalDateError(`${name} must be a safe integer`)
  }
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31
}

/** Howard Hinnant's civil-date algorithm, shifted to Unix epoch day 0. */
function epochDayFromCivil(year: number, month: number, day: number): number {
  const adjustedYear = year - (month <= 2 ? 1 : 0)
  const era = floorDiv(adjustedYear, 400)
  const yearOfEra = adjustedYear - era * 400
  const shiftedMonth = month + (month > 2 ? -3 : 9)
  const dayOfYear = floorDiv(153 * shiftedMonth + 2, 5) + day - 1
  const dayOfEra = yearOfEra * 365 + floorDiv(yearOfEra, 4) - floorDiv(yearOfEra, 100) + dayOfYear
  return era * DAYS_PER_400_YEARS + dayOfEra - 719468
}

function civilFromEpochDay(epochDay: number): { year: number; month: number; day: number } {
  const z = epochDay + 719468
  const era = floorDiv(z, DAYS_PER_400_YEARS)
  const dayOfEra = z - era * DAYS_PER_400_YEARS
  const yearOfEra = floorDiv(
    dayOfEra - floorDiv(dayOfEra, 1460) + floorDiv(dayOfEra, 36524) - floorDiv(dayOfEra, 146096),
    365
  )
  let year = yearOfEra + era * 400
  const dayOfYear = dayOfEra - (365 * yearOfEra + floorDiv(yearOfEra, 4) - floorDiv(yearOfEra, 100))
  const monthPrime = floorDiv(5 * dayOfYear + 2, 153)
  const day = dayOfYear - floorDiv(153 * monthPrime + 2, 5) + 1
  const month = monthPrime + (monthPrime < 10 ? 3 : -9)
  year += month <= 2 ? 1 : 0
  return { year, month, day }
}

function floorDiv(dividend: number, divisor: number): number {
  return Math.floor(dividend / divisor)
}

function floorMod(dividend: number, divisor: number): number {
  return ((dividend % divisor) + divisor) % divisor
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

function pad4(value: number): string {
  return String(value).padStart(4, "0")
}

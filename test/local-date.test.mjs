import assert from "node:assert/strict"
import test from "node:test"
import { LocalDate, LocalDateError } from "../dist/index.js"

test("constructs an immutable calendar date", () => {
  const date = new LocalDate(2026, 8, 2)
  assert.equal(date.year, 2026)
  assert.equal(date.month, 8)
  assert.equal(date.day, 2)
  assert.equal(Object.isFrozen(date), true)
})

test("validates all calendar fields", () => {
  assert.throws(() => new LocalDate(2025, 2, 29), LocalDateError)
  assert.throws(() => new LocalDate(2024, 13, 1), /month/)
  assert.throws(() => new LocalDate(-1, 1, 1), /year/)
  assert.throws(() => new LocalDate(10000, 1, 1), /year/)
  assert.throws(() => new LocalDate(2024.5, 1, 1), /safe integer/)
})

test("parses and formats exact ISO dates", () => {
  assert.equal(LocalDate.fromISO("0000-01-01").toISO(), "0000-01-01")
  assert.equal(LocalDate.fromISO("9999-12-31").toString(), "9999-12-31")
  assert.throws(() => LocalDate.fromISO("2026-8-02"), /YYYY-MM-DD/)
  assert.throws(() => LocalDate.fromISO("2026-02-29"), /day/)
})

test("uses the standard Unix epoch day", () => {
  assert.equal(new LocalDate(1970, 1, 1).epochDay, 0)
  assert.equal(LocalDate.fromEpochDay(0).toISO(), "1970-01-01")
  assert.equal(LocalDate.fromEpochDay(-1).toISO(), "1969-12-31")
  assert.equal(LocalDate.fromISO("2000-01-01").epochDay, 10957)
})

test("round-trips every sampled date through epoch days", () => {
  for (let year = 0; year <= 9999; year += 137) {
    for (const month of [1, 2, 3, 6, 9, 12]) {
      const day = Math.min(28, new LocalDate(year, month, 1).daysInMonth)
      const date = new LocalDate(year, month, day)
      assert.equal(LocalDate.fromEpochDay(date.epochDay).toISO(), date.toISO())
    }
  }
})

test("exposes ISO weekdays and calendar facts", () => {
  const date = new LocalDate(2026, 8, 2)
  assert.equal(date.dayOfWeek, 7)
  assert.equal(date.dayOfYear, 214)
  assert.equal(date.daysInMonth, 31)
  assert.equal(date.daysInYear, 365)
  assert.equal(date.isLeapYear, false)

  const leap = new LocalDate(2000, 2, 29)
  assert.equal(leap.dayOfWeek, 2)
  assert.equal(leap.daysInMonth, 29)
  assert.equal(leap.daysInYear, 366)
  assert.equal(leap.isLeapYear, true)
})

test("replaces fields immutably", () => {
  const original = new LocalDate(2024, 2, 29)
  const changed = original.with({ year: 2025 })
  assert.equal(original.toISO(), "2024-02-29")
  assert.equal(changed.toISO(), "2025-02-28")
  assert.throws(() => original.with({ year: 2025 }, { overflow: "reject" }), /invalid/)
})

test("adds years and months using calendar arithmetic", () => {
  assert.equal(new LocalDate(2024, 2, 29).plusYears(1).toISO(), "2025-02-28")
  assert.equal(new LocalDate(2024, 1, 31).plusMonths(1).toISO(), "2024-02-29")
  assert.equal(new LocalDate(2024, 3, 31).plusMonths(-1).toISO(), "2024-02-29")
  assert.equal(new LocalDate(2024, 1, 31).plus({ years: 1, months: 1 }).toISO(), "2025-02-28")
  assert.throws(
    () => new LocalDate(2024, 1, 31).plusMonths(1, { overflow: "reject" }),
    /invalid/
  )
})

test("adds weeks and days across boundaries", () => {
  assert.equal(new LocalDate(2024, 2, 28).plusDays(1).toISO(), "2024-02-29")
  assert.equal(new LocalDate(2024, 12, 31).plusDays(1).toISO(), "2025-01-01")
  assert.equal(new LocalDate(2025, 1, 8).plusWeeks(-1).toISO(), "2025-01-01")
  assert.equal(new LocalDate(2025, 1, 1).plus({ weeks: 2, days: 3 }).toISO(), "2025-01-18")
})

test("subtracts complete durations", () => {
  assert.equal(
    new LocalDate(2026, 8, 2).minus({ years: 1, months: 2, weeks: 1, days: 3 }).toISO(),
    "2025-05-23"
  )
})

test("rejects operations outside the supported range", () => {
  assert.throws(() => LocalDate.MIN.plusDays(-1), /year/)
  assert.throws(() => LocalDate.MAX.plusDays(1), /year/)
  assert.throws(() => LocalDate.MAX.plusYears(1), /year/)
})

test("compares dates explicitly and by numeric coercion", () => {
  const a = new LocalDate(2026, 1, 1)
  const b = new LocalDate(2026, 2, 1)
  assert.equal(LocalDate.compare(a, b), -1)
  assert.equal(a.equals(LocalDate.fromISO("2026-01-01")), true)
  assert.equal(a.isBefore(b), true)
  assert.equal(b.isAfter(a), true)
  assert.equal(a < b, true)
  assert.equal(`${a}`, "2026-01-01")
})

test("calculates signed day differences", () => {
  const start = new LocalDate(2024, 2, 28)
  const end = new LocalDate(2024, 3, 1)
  assert.equal(start.daysUntil(end), 2)
  assert.equal(end.daysUntil(start), -2)
})

test("checks ordered ranges", () => {
  const start = new LocalDate(2026, 1, 1)
  const middle = new LocalDate(2026, 1, 15)
  const end = new LocalDate(2026, 1, 31)
  assert.equal(middle.isBetween(start, end), true)
  assert.equal(start.isBetween(start, end, false), false)
  assert.throws(() => middle.isBetween(end, start), /start/)
})

test("converts to and from JavaScript Date without year 0-99 bugs", () => {
  const date = new LocalDate(42, 3, 4)
  const jsDate = date.toDateUTC()
  assert.equal(jsDate.getUTCFullYear(), 42)
  assert.equal(jsDate.getUTCMonth(), 2)
  assert.equal(jsDate.getUTCDate(), 4)
  assert.equal(LocalDate.fromDateUTC(jsDate).toISO(), "0042-03-04")
})

test("serializes cleanly", () => {
  const date = new LocalDate(2026, 8, 2)
  assert.equal(JSON.stringify({ date }), '{"date":"2026-08-02"}')
})

test("rejects malformed durations and options", () => {
  const date = new LocalDate(2026, 8, 2)
  assert.throws(() => date.plus({ days: 1.5 }), /safe integer/)
  assert.throws(() => date.plus(null), TypeError)
  assert.throws(() => date.with(null), TypeError)
  assert.throws(() => date.plusDays(Number.MAX_SAFE_INTEGER), LocalDateError)
  assert.throws(() => date.plusMonths(1, { overflow: "banana" }), /overflow/)
})

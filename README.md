# LocalDate

An immutable Gregorian calendar date for TypeScript and JavaScript.

`LocalDate` represents only a year, month, and day. It has no time, timezone, UTC offset, or daylight-saving behavior. Its core arithmetic does not use JavaScript `Date`, so calendar operations are deterministic in every runtime.

## Installation

```bash
npm install @c0pt3r/local-date
```

## Create dates

```ts
import { LocalDate } from "@c0pt3r/local-date"

const date = new LocalDate(2026, 8, 2)
const parsed = LocalDate.fromISO("2026-08-02")
const today = LocalDate.today()
const todayUTC = LocalDate.todayUTC()
```

The supported range is `0000-01-01` through `9999-12-31` in the proleptic Gregorian calendar.

## Read fields

```ts
 date.year         // 2026
 date.month        // 8
 date.day          // 2
 date.dayOfWeek    // 7; Monday = 1, Sunday = 7
 date.dayOfYear    // 214
 date.daysInMonth  // 31
 date.daysInYear   // 365
 date.isLeapYear   // false
```

## Immutable updates

Every operation returns a new `LocalDate`. Existing values never change.

```ts
const invoiceDate = new LocalDate(2024, 1, 31)
const nextMonth = invoiceDate.plusMonths(1)

invoiceDate.toISO() // "2024-01-31"
nextMonth.toISO()   // "2024-02-29"
```

Calendar arithmetic constrains the day by default when a target month is shorter:

```ts
new LocalDate(2024, 2, 29).plusYears(1).toISO() // "2025-02-28"
```

Use strict overflow handling when silent clamping is undesirable:

```ts
new LocalDate(2024, 1, 31).plusMonths(1, { overflow: "reject" })
// throws LocalDateError
```

Available operations:

```ts
date.with({ year: 2027, month: 3 })
date.plus({ years: 1, months: 2, weeks: 3, days: 4 })
date.minus({ months: 6 })
date.plusDays(10)
date.plusWeeks(2)
date.plusMonths(1)
date.plusYears(1)
```

## Epoch days

Epoch days use the conventional Unix date epoch:

```ts
new LocalDate(1970, 1, 1).epochDay // 0
LocalDate.fromEpochDay(-1).toISO() // "1969-12-31"
```

## Comparison and differences

```ts
const start = new LocalDate(2026, 1, 1)
const end = new LocalDate(2026, 2, 1)

LocalDate.compare(start, end) // -1
start.equals(end)             // false
start.isBefore(end)           // true
end.isAfter(start)            // true
start.daysUntil(end)          // 31

new LocalDate(2026, 1, 15).isBetween(start, end) // true
```

`isBetween()` requires ordered bounds and includes them by default.

## Conversion and serialization

```ts
date.toISO()          // "2026-08-02"
date.toString()       // "2026-08-02"
date.toJSON()         // "2026-08-02"
date.toDateUTC()      // JavaScript Date at midnight UTC
date.toLocaleString("en-CA", { dateStyle: "long" })
```

`JSON.stringify()` automatically emits the ISO date string.

## Error behavior

Invalid calendar values and out-of-range arithmetic throw `LocalDateError`, which extends `RangeError`. Incorrect argument types throw `TypeError`.

```ts
import { LocalDate, LocalDateError } from "@c0pt3r/local-date"
```

## Design guarantees

- Immutable values
- No runtime dependencies
- No timezone in the core model
- Standard Unix epoch-day semantics
- Strict `YYYY-MM-DD` parsing
- ISO weekday numbering
- Safe-integer validation
- Deterministic Gregorian arithmetic
- ESM package with TypeScript declarations
- Node.js 18 or newer

## License

MIT

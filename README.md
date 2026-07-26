# LocalDate

A lightweight TypeScript class representing a calendar date without a time or timezone.

Unlike JavaScript's built-in `Date`, `LocalDate` represents only a **year**, **month**, and **day**. Internally it stores dates at **midnight UTC**, making it ideal for business logic, scheduling, billing, recurring events, and any situation where a date should not shift because of time zones or daylight saving time.

## Features

* Simple API
* No timezone headaches
* No time-of-day component
* Supports dates before and after the Unix epoch
* ISO 8601 formatting
* JSON serialization
* Method chaining
* TypeScript support
* Zero runtime dependencies

---

## Installation

```bash
npm install @c0pt3r/local-date
```

---

## Basic usage

```ts
import { LocalDate } from "@c0pt3r/local-date";

const date = new LocalDate(2026, 7, 25);

console.log(date.toISO());
// 2026-07-25
```

---

## Creating dates

### Today's date

```ts
const today = new LocalDate();
```

This constructor uses the current **UTC** calendar date.

---

### From year, month and day

```ts
const christmas = new LocalDate(2026, 12, 25);
```

Months use the familiar range:

```text
1 = January
...
12 = December
```

The day defaults to **1** if omitted.

```ts
const july = new LocalDate(2026, 7);

console.log(july.toISO());
// 2026-07-01
```

Invalid dates throw an exception.

```ts
new LocalDate(2025, 2, 29);
// Error: Invalid date
```

---

### From an epoch day

```ts
const date = new LocalDate(0);
```

`epochDay` counts days since **Sunday, January 4, 1970**.

Using Sunday instead of January 1 makes weekday calculations extremely simple.

```text
epochDay 0 = Sunday
epochDay 1 = Monday
...
epochDay 6 = Saturday
```

---

# API

## Setters

All setters modify the current object and return `this`.

### setDate()

```ts
date.setDate(2026, 8, 15);
```

---

### setYear()

```ts
date.setYear(2027);
```

If the current day does not exist in the target year (for example February 29), it is automatically clamped to the last valid day.

---

### setMonth()

```ts
date.setMonth(2);
```

If the current day does not exist in the target month, it is automatically clamped.

Example:

```ts
new LocalDate(2026, 1, 31)
    .setMonth(2)
    .toISO();

// 2026-02-28
```

---

### setDay()

```ts
date.setDay(15);
```

Throws if the day is invalid for the current month.

---

### setEpochDay()

```ts
date.setEpochDay(5000);
```

Replaces the date using its epoch-day value.

---

### addDays()

```ts
date.addDays(30);
```

Negative values move backwards.

```ts
date.addDays(-7);
```

Month and year transitions are handled automatically.

---

## Getters

### getYear()

```ts
date.getYear();
```

---

### getMonth()

Returns a value between **1** and **12**.

```ts
date.getMonth();
```

---

### getDay()

Returns the day of the month.

```ts
date.getDay();
```

---

### getWeekDay()

Returns:

| Value | Day       |
| ----: | --------- |
|     0 | Sunday    |
|     1 | Monday    |
|     2 | Tuesday   |
|     3 | Wednesday |
|     4 | Thursday  |
|     5 | Friday    |
|     6 | Saturday  |

Example:

```ts
const saturday = new LocalDate(2026, 7, 25);

console.log(saturday.getWeekDay());
// 6
```

---

### getLastDayOfMonth()

```ts
new LocalDate(2024, 2, 1).getLastDayOfMonth();
// 29
```

---

### getEpochDay()

Returns the number of elapsed days since Sunday, January 4, 1970.

```ts
date.getEpochDay();
```

---

## Utility methods

### clone()

Creates an independent copy.

```ts
const original = new LocalDate(2026, 7, 25);

const copy = original.clone();

copy.addDays(1);

console.log(original.toISO());
// 2026-07-25

console.log(copy.toISO());
// 2026-07-26
```

---

### isBetween()

Checks whether a date lies between two others.

```ts
const start = new LocalDate(2026, 1, 1);
const end = new LocalDate(2026, 12, 31);

date.isBetween(start, end);
```

By default, the boundaries are included.

To exclude them:

```ts
date.isBetween(start, end, false);
```

---

## Conversion

### toISO()

Returns an ISO-8601 calendar date.

```ts
date.toISO();

// 2026-07-25
```

---

### toJSON()

`LocalDate` serializes naturally with `JSON.stringify()`.

```ts
const invoice = {
    dueDate: new LocalDate(2026, 7, 25)
};

console.log(JSON.stringify(invoice));
```

Output:

```json
{
    "dueDate": "2026-07-25"
}
```

---

### valueOf()

`LocalDate` can be compared directly.

```ts
const a = new LocalDate(2026, 1, 1);
const b = new LocalDate(2026, 2, 1);

console.log(a < b);
// true

console.log(a >= b);
// false
```

The numeric value is the epoch day.

---

# Method chaining

Because every mutating method returns `this`, operations can be chained.

```ts
const dueDate = new LocalDate(2026, 1, 31)
    .setMonth(2)
    .addDays(14)
    .setYear(2027);

console.log(dueDate.toISO());
```

---

# Mutability

`LocalDate` is **mutable**.

Every setter modifies the existing object.

If you need a new instance, call `clone()` first.

```ts
const original = new LocalDate(2026, 7, 25);

const tomorrow = original
    .clone()
    .addDays(1);
```

---

# Design goals

This library intentionally focuses on one thing:

> Representing a calendar date.

It deliberately does **not** implement:

* Time-of-day
* Time zones
* Daylight saving time
* Parsing arbitrary date formats
* Internationalized formatting
* Calendars other than the Gregorian calendar

If you need those features, JavaScript's `Date`, the upcoming `Temporal` API, or a dedicated date-time library may be a better fit.

---

# License

MIT

# LocalDate

A lightweight, immutable local date library for TypeScript.

`LocalDate` represents a **calendar date only** (year, month, day) without any time or time zone information. It is designed for business applications where a date should always mean the same calendar day, regardless of the user's location.

## Why?

JavaScript's built-in `Date` represents an instant in time. That makes it great for timestamps, but less suitable for concepts such as:

* Birthdays
* Invoice due dates
* Holidays
* Business schedules
* Payment dates
* Accounting periods

For example:

```ts
new Date("2026-01-01")
```

may represent a different calendar day depending on the user's time zone.

`LocalDate` avoids this problem by representing only the calendar date.

## Features

* Immutable
* Time zone independent
* No time-of-day component
* No external dependencies
* TypeScript-first
* Tree-shakeable
* Modern ESM package

## Installation

```bash
npm install @c0pt3r/local-date
```

## Basic Usage

```ts
import { LocalDate } from "@c0pt3r/local-date";

const today = LocalDate.today();

console.log(today.toString());
// 2026-07-25
```

Create a date:

```ts
const date = new LocalDate(2026, 7, 25);
```

Parse an ISO string:

```ts
const date = LocalDate.parse("2026-07-25");
```

Compare dates:

```ts
if (invoiceDate.isBefore(today)) {
    // overdue
}
```

Date arithmetic:

```ts
const nextWeek = today.plusDays(7);
const yesterday = today.minusDays(1);
```

## Design Goals

LocalDate follows a few simple principles:

* A date is **not** a timestamp.
* A date is **not** affected by time zones.
* Instances are immutable.
* Operations return new objects.
* Predictability is preferred over convenience.

## Non-Goals

This library intentionally does **not** provide:

* Time zones
* Date/time values
* Clocks
* Business calendars
* Holiday calculations
* Scheduling logic

These concepts belong in higher-level libraries built on top of `LocalDate`.

## Example

```ts
const invoiceDate = LocalDate.parse("2026-08-01");

const dueDate = invoiceDate.plusDays(30);

if (LocalDate.today().isAfter(dueDate)) {
    console.log("Payment overdue");
}
```

## Compatibility

* Node.js
* Bun
* Deno
* Modern browsers
* TypeScript

## License

MIT

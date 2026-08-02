# Changelog

## 1.0.0

First stable release.

- Rebuilt `LocalDate` as an immutable value object.
- Replaced JavaScript `Date`-based arithmetic with deterministic civil-date algorithms.
- Standardized epoch days on `1970-01-01 = 0`.
- Added strict ISO parsing and support for years `0000` through `9999`.
- Added calendar arithmetic with explicit `constrain` and `reject` overflow behavior.
- Added comparison, range, calendar-property, difference, serialization, and JavaScript Date conversion APIs.
- Added a dedicated `LocalDateError` type.
- Added boundary, leap-year, epoch, coercion, validation, and immutability tests.
- Added release packaging checks and CI coverage for supported Node.js versions.

This release intentionally does not preserve the pre-1.0 experimental API.

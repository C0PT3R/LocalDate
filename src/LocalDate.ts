const MS_PER_DAY = 864e5

export class LocalDate {

	/** The internal Date object */
	#date: Date

	/**
	 * Midnight UTC of the first Sunday after the Unix epoch (1970-01-04)
	 * Allows epochDay % 7 == 0 to always represent Sunday.
	 */
	static readonly #UNIX_SUNDAY_EPOCH = Date.UTC(1970, 0, 4)

	/**
	 * Creates a LocalDate representing today's date
	 */
	public constructor()

	/**
	 * Creates a LocalDate representing the specified date
	 * @param epochDay The number of elapsed days since the first UNIX Sunday
	 */
	public constructor(epochDay: number)

	/**
	 * Creates a LocalDate representing the specified date
	 * @param year The year.
	 * @param month The month (1 - 12).
	 * @param day The day (optionnal). Default is 1
	 */
	public constructor(year: number, month: number, day?: number)
	
	/* Main constructor */
	public constructor(yearOrEpochDay?: number, month?: number, day?: number) {
		// No arguments were passed
		if (yearOrEpochDay === undefined) {
			const now = new Date()
			this.#date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
		}
		// Only epoch day was passed
		else if (month === undefined) {
			this.#date = new Date(0)
			this.setEpochDay(yearOrEpochDay as number)
		}
		// Year, month and possibly day were passed
		else {
			month = month ?? 1
			day = day ?? 1
			
			if (!LocalDate.isValidDate(yearOrEpochDay as number, month, day))
				throw new Error("Invalid date")
			
			this.#date = new Date(Date.UTC(yearOrEpochDay as number, month - 1, day))
		}
	}
	
	/**
	 * Simple date validation helper
	 */
	private static isValidDate(year: number, month: number, day: number): boolean {
		const d = new Date(Date.UTC(year, month - 1, day))

		return (
			d.getUTCFullYear() === year &&
			d.getUTCMonth() === month - 1 &&
			d.getUTCDate() === day
		)
	}

	/**
	 * Sets the epoch day
	 * @param epochDay The number of elapsed days since the first UNIX Sunday.
	 * @returns Self.
	 */
	public setEpochDay(epochDay: number): this {
		if (!Number.isInteger(epochDay))
		    throw new Error("Invalid epoch day")

		this.#date.setTime((epochDay * MS_PER_DAY) + LocalDate.#UNIX_SUNDAY_EPOCH)
		this.#date.setUTCHours(0, 0, 0, 0)
		return this
	}

	/**
	 * Sets the day of month
	 * @returns Self.
	 */
	public setDay(day: number): this {
		if (day < 1 || day > this.getLastDayOfMonth())
			throw new Error("Invalid day")

		this.#date.setUTCDate(day)
		return this
	}

	/**
	 * Sets the month
	 * @returns Self.
	 */
	public setMonth(month: number): this {
		if (month < 1 || month > 12)
			throw new Error("Invalid month")

		const day = this.getDay()

		// Prevent JS Date rollover
		this.#date.setUTCDate(1)
		this.#date.setUTCMonth(month - 1)
		this.#date.setUTCDate(Math.min(day, this.getLastDayOfMonth()))

		return this
	}

	/**
	 * Sets the year
	 * @returns Self.
	 */
	public setYear(year: number): this {
		if (!Number.isInteger(year))
			throw new Error("Invalid year")

		const day = this.getDay()

		// Prevent JS Date rollover
		this.#date.setUTCDate(1)
		this.#date.setUTCFullYear(year)
		this.#date.setUTCDate(Math.min(day, this.getLastDayOfMonth()))

		return this
	}

	/**
	 * Sets the complete date
	 * @returns Self.
	 */
	public setDate(year: number, month: number, day: number): this {
		if (!LocalDate.isValidDate(year, month, day))
    		throw new Error("Invalid date")

		this.#date.setUTCFullYear(year, month - 1, day)
		return this
	}

	/**
	 * Gets the day of week, from 0 and 6, starting from Sunday
	 * @returns The day of the week
	 */
	public getWeekDay(): number {
		return this.getEpochDay() % 7
	}

	/**
	 * Creates a copy of the LocalDate. Useful if you want to modify a date without affecting the original one.
	 * @returns A copy of self
	 */
	public clone(): LocalDate {
		return new LocalDate(this.getEpochDay())
	}

	/**
	 * Move date of numDays
	 * @param numDays Number of days (can be positive or negative)
	 * @returns Self
	 */
	public addDays(numDays: number): this {
		this.#date.setUTCDate(this.#date.getUTCDate() + numDays)
		return this
	}

	/**
	 * Checks if a date falls between a and b
	 * @param a 
	 * @param b 
	 * @param inclusive 
	 * @returns 
	 */
	public isBetween(a: LocalDate, b: LocalDate, inclusive: boolean = true): boolean {
		if (inclusive)
			return this >= a && this <= b
		
		return this > a && this < b
	}

	/**
	 * The number of elapsed days since the first UNIX Sunday
	 */
	public getEpochDay(): number {
		return Math.trunc((this.#date.getTime() - LocalDate.#UNIX_SUNDAY_EPOCH) / MS_PER_DAY)
	}

	/**
	 * The day of month
	 */
	public getDay(): number {
		return this.#date.getUTCDate()
	}

	/**
	 * The month
	 */
	public getMonth(): number {
		return this.#date.getUTCMonth() + 1
	}

	/**
	 * The year
	 */
	public getYear(): number {
		return this.#date.getUTCFullYear()
	}

	/**
	 * The last day of the month
	 */
	public getLastDayOfMonth(): number {
		const d = new Date(Date.UTC(this.getYear(), this.getMonth(), 0))
		return d.getUTCDate()
	}

	public valueOf(): number {
		return this.getEpochDay()
	}

	public toISO(): string {
		return this.#date.toISOString().slice(0, 10)
	}
	
	public toJSON(): string {
    	return this.toISO()
	}

}
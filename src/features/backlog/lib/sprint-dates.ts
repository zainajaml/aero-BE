/** "yyyy-MM-dd" from the date picker → ISO date-time at UTC midnight (as the source stored it). */
export const dateInputToIso = (v: string): string | null => (v ? `${v}T00:00:00.000Z` : null);

/** ISO date-time → "yyyy-MM-dd" for the date picker. */
export const isoToDateInput = (v: string | null): string =>
  v ? new Date(v).toISOString().slice(0, 10) : "";

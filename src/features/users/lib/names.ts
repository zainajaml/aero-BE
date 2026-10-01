type NameParts =
  | {
      firstName?: string | null;
      lastName?: string | null;
      fullName?: string | null;
      email?: string | null;
    }
  | null
  | undefined;

/** "First Last", else full name, else email local part, else the fallback (source formatDisplayName). */
export function displayName(person: NameParts, fallback = "Unknown"): string {
  if (!person) return fallback;
  const combined = [person.firstName, person.lastName]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" ");
  if (combined) return combined;
  if (person.fullName?.trim()) return person.fullName.trim();
  if (person.email) return person.email.split("@")[0] ?? fallback;
  return fallback;
}

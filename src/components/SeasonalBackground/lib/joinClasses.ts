type ClassValue = string | false | null | undefined;

export function joinClasses(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
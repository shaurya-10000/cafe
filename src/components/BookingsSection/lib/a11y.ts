/** Id of a field's error paragraph, referenced via `aria-describedby`. */
export function errorIdFor(fieldId: string): string {
  return `${fieldId}-error`;
}

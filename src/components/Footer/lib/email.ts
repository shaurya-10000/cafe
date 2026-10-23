import { EMAIL_REGEX } from "../constants";

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

/**
 * Sanitize and normalize a Nigerian phone number to +234XXXXXXXXXX format.
 * Handles: 08012345678, 8012345678, +2348012345678, 2348012345678,
 *          080-1234-5678, (080) 1234 5678, etc.
 *
 * Returns null if the input is not a valid Nigerian number.
 */
export function sanitizePhone(raw: string): string | null {
  // Strip everything that isn't a digit or leading +
  const stripped = raw.replace(/[^\d+]/g, "");

  // Remove leading + if present, work with digits only
  const digits = stripped.replace(/^\+/, "");

  let local: string;

  if (digits.startsWith("234") && digits.length >= 13) {
    // +2348012345678 or 2348012345678
    local = digits.slice(3);
  } else if (digits.startsWith("0") && digits.length === 11) {
    // 08012345678
    local = digits.slice(1);
  } else if (digits.length === 10 && !digits.startsWith("0")) {
    // 8012345678
    local = digits;
  } else {
    return null;
  }

  // Nigerian mobile numbers: 10 digits starting with 7, 8, or 9
  if (local.length !== 10 || !/^[789]/.test(local)) {
    return null;
  }

  return `+234${local}`;
}

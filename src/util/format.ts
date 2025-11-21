export function formatPhoneNumber(phone: number | string): string {
  if (phone === null) {
    // null phone
    return "";
  } else if (typeof phone === "number") {
    // numeric phone
    const phoneStr = phone.toString().padStart(10, "0");
    return `(${phoneStr.slice(0, 3)}) ${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
  } else if (typeof phone === "string") {
    const digits = phone.replace(/\D/g, "").padStart(10, "0");

    if (digits.length !== 10) {
      // non-US phone number? just return as-is
      return phone;
    } else {
      // convert to (XXX) XXX-XXXX format
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
  } else {
    throw new Error(`Invalid phone number type: ${typeof phone}`);
  }
}

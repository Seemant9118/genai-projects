export function cleanText(input) {
  if (typeof input !== "string") return "";

  return input
    // remove null bytes
    .replace(/\u0000/g, "")
    // remove zero-width chars
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    // normalize non-breaking spaces
    .replace(/\u00A0/g, " ")
    // normalize unicode line separators
    .replace(/[\u2028\u2029]/g, "\n")
    // normalize newlines
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    // normalize spaces
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

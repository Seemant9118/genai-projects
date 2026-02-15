export function normalizeExtractedText(text) {
  if (Array.isArray(text)) {
    return text.join("\n\n");
  }
  if (typeof text === "string") {
    return text;
  }
  return "";
}

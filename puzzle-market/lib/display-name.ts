export function sanitizeUsername(
  value?: string | null
) {
  return (value || "")
    .trim()
    .replace(
      /[^a-zA-Z0-9_-]/g,
      ""
    )
    .slice(0, 24);
}

export function isCompleteUsername(
  value?: string | null
) {
  return (
    sanitizeUsername(value)
      .length >= 3
  );
}

export function cleanPublicName(
  value?: string | null
) {
  const sanitized =
    sanitizeUsername(value);

  if (sanitized.length >= 3) {
    return sanitized;
  }

  return "Collector";
}

export function cleanPublicName(
  value?: string | null
) {
  const raw =
    (value || "").trim();

  if (
    !raw ||
    raw.includes("@")
  ) {
    return "Collector";
  }

  return raw
    .replace(
      /[^a-zA-Z0-9_-]/g,
      ""
    )
    .slice(0, 24) ||
    "Collector";
}

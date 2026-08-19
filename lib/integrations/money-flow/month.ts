export function monthBounds(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  const dateOnly = (value: Date) => value.toLocaleDateString("en-CA");

  return { start: dateOnly(start), end: dateOnly(end) };
}

export function monthLabel(offset = 0) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Keep the v1 key and legacy computer IDs: no destructive migration.
export const storageKey = "my-books:read:v1";
export function parseRead(raw) {
  try {
    const values = JSON.parse(raw || "[]");
    return Array.isArray(values)
      ? [...new Set(values.filter((x) => typeof x === "string"))]
      : [];
  } catch {
    return [];
  }
}

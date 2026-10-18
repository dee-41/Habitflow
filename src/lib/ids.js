/** Generates a stable, collision-resistant ID for any record. */
export function newId() {
  return crypto.randomUUID()
}
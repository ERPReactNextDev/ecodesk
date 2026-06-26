/**
 * Normalizes a name to Title Case format.
 * Example: "aaron carls" -> "Aaron Carls"
 *          "AARON CARLS" -> "Aaron Carls"
 *          "aaron Carls" -> "Aaron Carls"
 */
export function normalizeName(name: string): string {
  if (!name) return "";
  
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => {
      if (word.length === 0) return "";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ")
    .trim();
}

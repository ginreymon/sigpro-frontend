/** Extracts the file name from a Content-Disposition header, or returns the fallback. */
export function filenameFromContentDisposition(header: string | null, fallback: string): string {
  return header?.match(/filename="?([^";]+)"?/i)?.[1] ?? fallback;
}

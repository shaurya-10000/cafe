export function logFetchError(
  resource: string,
  error: { code?: string },
): void {
  console.error(
    `[admin] ${resource} fetch failed`,
    { code: error.code },
    error,
  );
}

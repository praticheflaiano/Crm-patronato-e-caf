/**
 * Validates a redirect URL to prevent Open Redirect vulnerabilities.
 * If the URL is external or invalid, it returns a URL pointing to the base origin.
 *
 * @param redirectTo The redirect path or URL from user input
 * @param baseOrigin The trusted base origin (e.g., requestUrl.origin)
 * @returns A safe URL object
 */
export function getSafeRedirect(redirectTo: string | null, baseOrigin: string): URL {
  const defaultUrl = new URL('/', baseOrigin);

  if (!redirectTo) {
    return defaultUrl;
  }

  try {
    // Try to parse redirectTo as a URL with baseOrigin
    const url = new URL(redirectTo, baseOrigin);

    // Check if the origin matches the baseOrigin
    if (url.origin === baseOrigin) {
      return url;
    }
  } catch (e) {
    // If parsing fails, fall back to default
  }

  return defaultUrl;
}

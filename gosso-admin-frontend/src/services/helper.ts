/**
 * Standard error extraction helper for API responses following the unified {code, message, data} envelope.
 */
export async function extractErrorMessage(res: Response, fallbackMessage: string): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body === 'object' && body !== null) {
      if (typeof body.message === 'string' && body.message.trim()) {
        return body.message;
      }
      if (typeof body.error_description === 'string' && body.error_description.trim()) {
        return body.error_description;
      }
      if (typeof body.error?.message === 'string' && body.error.message.trim()) {
        return body.error.message;
      }
      if (typeof body.error === 'string' && body.error.trim()) {
        return body.error;
      }
    }
  } catch {
    // Response body is not JSON or already consumed
  }
  return `${fallbackMessage}: ${res.statusText || res.status}`;
}

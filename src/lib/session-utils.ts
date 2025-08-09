/**
 * Generates a unique session ID with timestamp and random string
 * @returns A unique session ID in the format "session_{timestamp}_{randomString}"
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
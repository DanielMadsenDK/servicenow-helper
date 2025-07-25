import fs from 'fs';
import path from 'path';

// Use filesystem to store cancellation state - works across module instances
const STORE_DIR = path.join(process.cwd(), '.next', 'polling-store');
const CANCELLED_PREFIX = 'cancelled_';

// Sanitize session key to prevent path traversal attacks
const sanitizeSessionKey = (sessionKey: string): string => {
  // Remove any path separators and limit to alphanumeric characters and underscores
  return sessionKey.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 100);
};

// Ensure directory exists
const ensureStoreDir = () => {
  try {
    if (!fs.existsSync(STORE_DIR)) {
      fs.mkdirSync(STORE_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Failed to create polling store directory:', error);
  }
};

export const markSessionCancelled = (sessionKey: string): void => {
  try {
    ensureStoreDir();
    const safeSessionKey = sanitizeSessionKey(sessionKey);
    const filePath = path.join(STORE_DIR, `${CANCELLED_PREFIX}${safeSessionKey}`);
    fs.writeFileSync(filePath, Date.now().toString());
  } catch (error) {
    console.error(`Failed to mark session ${sessionKey} as cancelled:`, error);
  }
};

export const isSessionCancelled = (sessionKey: string): boolean => {
  try {
    ensureStoreDir();
    const safeSessionKey = sanitizeSessionKey(sessionKey);
    const filePath = path.join(STORE_DIR, `${CANCELLED_PREFIX}${safeSessionKey}`);
    return fs.existsSync(filePath);
  } catch (error) {
    console.error(`Failed to check if session ${sessionKey} is cancelled:`, error);
    return false;
  }
};

export const cleanupSession = (sessionKey: string): void => {
  try {
    ensureStoreDir();
    const safeSessionKey = sanitizeSessionKey(sessionKey);
    const filePath = path.join(STORE_DIR, `${CANCELLED_PREFIX}${safeSessionKey}`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Failed to cleanup session ${sessionKey}:`, error);
  }
};
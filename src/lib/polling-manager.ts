// Store both controllers and cancellation flags
const pollingData = new Map<string, { controller: AbortController; cancelled: boolean }>();

export const registerPollingOperation = (sessionKey: string, controller: AbortController) => {
  pollingData.set(sessionKey, { controller, cancelled: false });
};

export const isPollingOperationActive = (sessionKey: string): boolean => {
  const data = pollingData.get(sessionKey);
  return !!(data && !data.cancelled);
};

export const cancelPollingOperation = (sessionKey: string): boolean => {
  const data = pollingData.get(sessionKey);
  if (data) {
    data.controller.abort();
    data.cancelled = true;
    return true;
  }
  return false;
};

export const cleanupPollingOperation = (sessionKey: string) => {
  pollingData.delete(sessionKey);
};
/** True when a write failed because the browser's storage quota is exhausted. */
export function isQuotaExceeded(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      error.code === 22)
  );
}

/**
 * Turn a save failure into an actionable, reassuring message. Every message makes
 * clear the current in-memory work is not lost, steering the knitter to export.
 */
export function describeStorageError(error: unknown): string {
  if (isQuotaExceeded(error)) {
    return "This device's storage is full, so your latest change wasn't saved. Free up space or export your chart to keep it — your current work is still open.";
  }
  return "Your latest change couldn't be saved on this device. Your current work is still open, so export it to be safe.";
}

/**
 * Ask the browser to keep local data durable (best effort). Returns whether
 * storage is persisted; never throws so callers can fire-and-forget.
 */
export async function ensurePersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !navigator.storage?.persist) {
      return false;
    }
    if (await navigator.storage.persisted?.()) {
      return true;
    }
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

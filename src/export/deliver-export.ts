export type DeliveryResult = "shared" | "saved" | "downloaded" | "cancelled";

export type ExportCapabilities = {
  canShare: boolean;
  canSave: boolean;
};

/**
 * Detect optional OS integrations. Download is always available, so it isn't
 * reported here — the UI shows Share/Save only when these are true.
 */
export function getExportCapabilities(): ExportCapabilities {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  return {
    canShare:
      !!nav &&
      typeof nav.share === "function" &&
      typeof nav.canShare === "function",
    canSave:
      typeof window !== "undefined" && "showSaveFilePicker" in window,
  };
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/** Always-available fallback: trigger a browser download of the Blob. */
export function downloadBlob(blob: Blob, filename: string): DeliveryResult {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}

/** Web Share (files). Returns "cancelled" if the user dismisses the sheet. */
export async function shareBlob(
  blob: Blob,
  filename: string,
  title: string,
): Promise<DeliveryResult> {
  const file = new File([blob], filename, { type: blob.type });
  if (!navigator.canShare?.({ files: [file] })) {
    return downloadBlob(blob, filename);
  }
  try {
    await navigator.share({ files: [file], title });
    return "shared";
  } catch (error) {
    if (isAbort(error)) {
      return "cancelled";
    }
    return downloadBlob(blob, filename);
  }
}

type SaveFilePickerWindow = typeof window & {
  showSaveFilePicker: (options?: {
    suggestedName?: string;
    types?: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};

/** File System Access save picker. Falls back to download when unavailable. */
export async function saveBlob(
  blob: Blob,
  filename: string,
  accept: Record<string, string[]>,
): Promise<DeliveryResult> {
  if (!("showSaveFilePicker" in window)) {
    return downloadBlob(blob, filename);
  }
  try {
    const handle = await (window as SaveFilePickerWindow).showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: "Chart export", accept }],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return "saved";
  } catch (error) {
    if (isAbort(error)) {
      return "cancelled";
    }
    return downloadBlob(blob, filename);
  }
}

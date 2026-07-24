import { describe, expect, it } from "vitest";
import { describeStorageError, isQuotaExceeded } from "./storage-errors";

describe("storage error mapping", () => {
  it("detects QuotaExceededError by name", () => {
    const quota = new DOMException("full", "QuotaExceededError");
    expect(isQuotaExceeded(quota)).toBe(true);
  });

  it("gives a quota-specific, reassuring message", () => {
    const quota = new DOMException("full", "QuotaExceededError");
    const message = describeStorageError(quota);
    expect(message).toMatch(/storage is full/i);
    expect(message).toMatch(/still open/i);
  });

  it("gives a generic save-failure message for other errors", () => {
    const message = describeStorageError(new Error("boom"));
    expect(message).toMatch(/couldn't be saved/i);
    expect(message).toMatch(/still open/i);
    expect(isQuotaExceeded(new Error("boom"))).toBe(false);
  });
});

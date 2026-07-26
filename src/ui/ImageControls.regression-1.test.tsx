import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createEmptyPatternProject, fullImageCrop } from "../domain/models";
import { ImageControls } from "./ImageControls";

// Regression: ISSUE-002 — native file input shows "No file chosen" after a
// photo is loaded (input value is cleared on change / reopen).
// Found by /qa on 2026-07-26
// Report: .gstack/qa-reports/qa-report-localhost-5173-2026-07-26.md

const baseProps = {
  framingCrop: fullImageCrop(20, 10),
  imageWidth: 20,
  imageHeight: 10,
  previewUrl: "blob:qa-preview",
  error: null,
  onFileChange: () => undefined,
  onRotate: () => undefined,
  onFramingCropChange: () => undefined,
  onApplyFraming: () => undefined,
  onDetailChange: () => undefined,
  onDimensionChange: () => undefined,
  onAspectLockChange: () => undefined,
  onMaxColorsChange: () => undefined,
};

describe("ImageControls photo picker label", () => {
  it("offers Choose photo when no source image is loaded", () => {
    render(
      <ImageControls
        {...baseProps}
        draft={createEmptyPatternProject("Blank")}
        framingCrop={null}
        previewUrl={null}
      />,
    );

    expect(screen.getByText("Select photo")).toBeInTheDocument();
    expect(screen.getByLabelText(/choose a photo/i)).toBeInTheDocument();
    expect(screen.queryByText(/no file chosen/i)).not.toBeInTheDocument();
  });

  it("offers Replace photo when a source image is already loaded", () => {
    const draft = {
      ...createEmptyPatternProject("Loaded"),
      sourceImage: new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }),
      crop: fullImageCrop(20, 10),
    };

    render(<ImageControls {...baseProps} draft={draft} />);

    expect(screen.getByText("Replace photo")).toBeInTheDocument();
    expect(
      screen.getByLabelText(/choose a different photo/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/no file chosen/i)).not.toBeInTheDocument();
  });
});

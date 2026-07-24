import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createEmptyPatternProject } from "../domain/models";
import { createLocalRepository } from "../repository/local-repository";
import { Studio } from "./Studio";

const tinyPng = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
  0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f,
  0x00, 0x05, 0xfe, 0x02, 0xfe, 0xa7, 0x35, 0x81, 0x84, 0x00, 0x00, 0x00,
  0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

describe("Studio image controls", () => {
  it("selects, rotates, crops, and restores a source image after reopen", async () => {
    const user = userEvent.setup();
    const repository = await createLocalRepository(
      `knit-pro-ui-${crypto.randomUUID()}`,
    );
    const project = createEmptyPatternProject("Mountain fox");
    await repository.savePatternProject(project);

    const onProjectChange = vi.fn(async (next) => {
      await repository.savePatternProject(next);
    });

    const decode = vi.fn(async () => ({ width: 200, height: 100 }));
    const { unmount } = render(
      <Studio
        project={project}
        onBack={() => undefined}
        onProjectChange={onProjectChange}
        decodeSourceImage={decode}
      />,
    );

    const controls = screen.getByRole("region", { name: /image controls/i });
    const fileInput = within(controls).getByLabelText(/select photo/i);
    const file = new File([tinyPng], "fox.png", { type: "image/png" });
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByAltText(/source preview/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/200 × 100/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /rotate 90°/i }));
    await waitFor(() => {
      expect(onProjectChange).toHaveBeenCalled();
    });

    const widthInput = screen.getByLabelText(/crop width/i);
    fireEvent.change(widthInput, { target: { value: "120" } });

    await waitFor(() => {
      expect(screen.getByTestId("crop-preview")).toHaveAttribute(
        "data-crop",
        "0,0,120,100",
      );
    });

    await waitFor(async () => {
      const saved = await repository.getPatternProject(project.id);
      expect(saved?.sourceFileName).toBe("fox.png");
      expect(saved?.rotationDegrees).toBe(90);
      expect(saved?.crop?.width).toBe(120);
      expect(saved?.sourceImage).toBeInstanceOf(Blob);
    });

    unmount();

    const restored = await repository.getPatternProject(project.id);
    expect(restored).toBeDefined();

    render(
      <Studio
        project={restored!}
        onBack={() => undefined}
        onProjectChange={onProjectChange}
        decodeSourceImage={decode}
      />,
    );

    expect(await screen.findByAltText(/source preview/i)).toBeInTheDocument();
    expect(screen.getByText(/rotation: 90°/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/crop width/i)).toHaveValue(120);
  });

  it("shows guidance when an unsupported image is selected", async () => {
    const project = createEmptyPatternProject("Mountain fox");

    render(
      <Studio
        project={project}
        onBack={() => undefined}
        onProjectChange={async () => undefined}
        decodeSourceImage={async () => ({ width: 10, height: 10 })}
      />,
    );

    const fileInput = screen.getByLabelText(/select photo/i);
    const file = new File([tinyPng], "drawing.gif", { type: "image/gif" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(/jpeg, png, or webp/i);
  });
});

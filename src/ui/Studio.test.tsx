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

function fakeRgba(width: number, height: number) {
  const data = new Uint8ClampedArray(width * height * 4);
  data.fill(180);
  for (let i = 3; i < data.length; i += 4) {
    data[i] = 255;
  }
  return { width, height, data };
}

const stubRasterize = vi.fn(async () => fakeRgba(20, 10));
const stubGenerate = vi.fn(async ({ width, height, maxColors }) => ({
  width,
  height,
  cells: Array.from({ length: width * height }, (_, index) =>
    index % 2 === 0 ? 0 : 1,
  ),
  palette: [
    {
      index: 0,
      hex: "#203040",
      symbol: "▲",
      stitchCount: Math.ceil((width * height) / 2),
    },
    {
      index: 1,
      hex: "#d0a050",
      symbol: "●",
      stitchCount: Math.floor((width * height) / 2),
    },
  ].slice(0, Math.max(1, Math.min(maxColors, 2))),
}));

const studioProps = {
  inventory: [],
  onInventoryChange: async () => undefined,
  onBack: () => undefined,
  decodeSourceImage: async () => ({ width: 200, height: 100 }),
  rasterizeSource: stubRasterize,
  generateChart: stubGenerate,
  confirmRegeneration: () => true,
};

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

    const { unmount } = render(
      <Studio
        {...studioProps}
        project={project}
        onProjectChange={onProjectChange}
        decodeSourceImage={async () => ({ width: 200, height: 100 })}
      />,
    );

    const controls = screen.getByRole("region", { name: /image controls/i });
    const fileInput = within(controls).getByLabelText(/select photo/i);
    const file = new File([tinyPng], "fox.png", { type: "image/png" });
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByAltText(/source preview/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /rotate 90°/i }));
    fireEvent.change(screen.getByLabelText(/crop width/i), {
      target: { value: "120" },
    });

    await waitFor(async () => {
      const saved = await repository.getPatternProject(project.id);
      expect(saved?.crop?.width).toBe(120);
      expect(saved?.rotationDegrees).toBe(90);
    });

    unmount();
    const restored = await repository.getPatternProject(project.id);
    render(
      <Studio
        {...studioProps}
        project={restored!}
        onProjectChange={onProjectChange}
      />,
    );
    expect(await screen.findByLabelText(/crop width/i)).toHaveValue(120);
  });

  it("shows guidance when an unsupported image is selected", async () => {
    render(
      <Studio
        {...studioProps}
        project={createEmptyPatternProject("Mountain fox")}
        onProjectChange={async () => undefined}
      />,
    );

    fireEvent.change(screen.getByLabelText(/select photo/i), {
      target: {
        files: [new File([tinyPng], "drawing.gif", { type: "image/gif" })],
      },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(/jpeg, png, or webp/i);
  });

  it("generates a Colorwork Chart from detail and color controls", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const project = createEmptyPatternProject("Mountain fox");

    render(
      <Studio
        {...studioProps}
        project={project}
        onProjectChange={async () => undefined}
      />,
    );

    await user.upload(
      screen.getByLabelText(/select photo/i),
      new File([tinyPng], "fox.png", { type: "image/png" }),
    );
    await waitFor(() => expect(stubGenerate).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText(/maximum colors/i), {
      target: { value: "4" },
    });
    await vi.advanceTimersByTimeAsync(350);
    expect(
      await screen.findByRole("table", { name: /colorwork chart/i }),
    ).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("replaces a chart color from Yarn Inventory and supports undo", async () => {
    const user = userEvent.setup();
    const project = createEmptyPatternProject("Mountain fox");
    let latest = project;
    const onProjectChange = vi.fn(async (next) => {
      latest = next;
    });
    const inventory = [
      {
        id: "yarn-1",
        name: "Forest green",
        displayColor: "#1f3d32",
        schemaVersion: 1 as const,
      },
    ];

    render(
      <Studio
        {...studioProps}
        project={project}
        inventory={inventory}
        onProjectChange={onProjectChange}
      />,
    );

    await user.upload(
      screen.getByLabelText(/select photo/i),
      new File([tinyPng], "fox.png", { type: "image/png" }),
    );

    const useYarn = await screen.findByRole("button", {
      name: /use this yarn/i,
    });
    await user.click(useYarn);

    await waitFor(() => {
      expect(latest.chart?.palette.some((entry) => entry.yarnLabel === "Forest green")).toBe(
        true,
      );
    });

    await user.click(screen.getByRole("button", { name: /^undo$/i }));
    await waitFor(() => {
      expect(
        latest.chart?.palette.every((entry) => entry.yarnLabel !== "Forest green"),
      ).toBe(true);
    });
  });
});

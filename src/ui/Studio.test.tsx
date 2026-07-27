import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createBlankChart } from "../chart/blank-chart";
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
  it(
    "selects, rotates, applies framing, and restores after reopen",
    async () => {
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
    const fileInput = within(controls).getByLabelText(/choose a photo|replace photo/i);
    fireEvent.change(fileInput, {
      target: { files: [new File([tinyPng], "fox.png", { type: "image/png" })] },
    });

    await waitFor(() => {
      expect(screen.getByAltText(/source preview/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /rotate 90°/i }));

    await waitFor(async () => {
      const saved = await repository.getPatternProject(project.id);
      expect(saved?.rotationDegrees).toBe(90);
      expect(saved?.crop?.width).toBeGreaterThan(0);
    });

    const cropBeforeZoom = screen.getByTestId("crop-preview").getAttribute("data-crop");
    const framing = screen.getByRole("region", { name: /image controls/i });
    await user.click(within(framing).getByRole("button", { name: /zoom in/i }));
    await waitFor(() => {
      expect(screen.getByTestId("crop-preview").getAttribute("data-crop")).not.toBe(
        cropBeforeZoom,
      );
    });

    await user.click(within(framing).getByRole("button", { name: /apply framing/i }));

    await waitFor(async () => {
      const saved = await repository.getPatternProject(project.id);
      expect(saved?.crop).toBeTruthy();
      expect(
        `${saved?.crop?.x},${saved?.crop?.y},${saved?.crop?.width},${saved?.crop?.height}`,
      ).toBe(screen.getByTestId("crop-preview").getAttribute("data-crop"));
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
    expect(await screen.findByAltText(/source preview/i)).toBeInTheDocument();
    expect(screen.getByTestId("crop-preview")).toHaveAttribute("data-crop");
  },
    15_000,
  );

  it("does not persist framing while dragging until Apply is pressed", async () => {
    const user = userEvent.setup();
    const onProjectChange = vi.fn(async () => undefined);
    const project = createEmptyPatternProject("Mountain fox");

    render(
      <Studio
        {...studioProps}
        project={project}
        onProjectChange={onProjectChange}
      />,
    );

    await user.upload(
      screen.getByLabelText(/choose a photo|replace photo/i),
      new File([tinyPng], "fox.png", { type: "image/png" }),
    );
    await waitFor(() => expect(screen.getByAltText(/source preview/i)).toBeInTheDocument());

    const callsAfterUpload = onProjectChange.mock.calls.length;
    const framing = screen.getByRole("region", { name: /image controls/i });
    await user.click(within(framing).getByRole("button", { name: /zoom in/i }));

    expect(onProjectChange.mock.calls.length).toBe(callsAfterUpload);
    expect(
      within(framing).getByRole("button", { name: /apply framing/i }),
    ).toBeEnabled();
  });

  it("shows guidance when an unsupported image is selected", async () => {
    render(
      <Studio
        {...studioProps}
        project={createEmptyPatternProject("Mountain fox")}
        onProjectChange={async () => undefined}
      />,
    );

    fireEvent.change(screen.getByLabelText(/choose a photo|replace photo/i), {
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
      screen.getByLabelText(/choose a photo|replace photo/i),
      new File([tinyPng], "fox.png", { type: "image/png" }),
    );
    await waitFor(() => expect(stubGenerate).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText(/maximum colors/i), {
      target: { value: "4" },
    });
    await vi.advanceTimersByTimeAsync(350);
    expect(
      await screen.findByRole("img", { name: /colorwork chart/i }),
    ).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("enables export and reveals PDF/PNG download actions once a chart exists", async () => {
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

    expect(screen.getByRole("button", { name: /^export$/i })).toBeDisabled();

    await user.upload(
      screen.getByLabelText(/choose a photo|replace photo/i),
      new File([tinyPng], "fox.png", { type: "image/png" }),
    );
    await vi.advanceTimersByTimeAsync(350);
    await screen.findByRole("img", { name: /colorwork chart/i });

    const exportButton = screen.getByRole("button", { name: /^export$/i });
    expect(exportButton).toBeEnabled();
    await user.click(exportButton);

    expect(screen.getByRole("heading", { name: /^pdf$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^png$/i })).toBeInTheDocument();
    expect(
      screen.getAllByRole("menuitem", { name: /download/i }),
    ).toHaveLength(2);

    // The menu is keyboard-usable: focus lands inside it and Escape returns.
    expect(
      screen.getByRole("menuitem", { name: /download as pdf/i }),
    ).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(exportButton).toHaveFocus();
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
      screen.getByLabelText(/choose a photo|replace photo/i),
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

describe("Studio with a blank-canvas project", () => {
  function blankProject(name = "Alpine motif") {
    const base = createEmptyPatternProject(name);
    return {
      ...base,
      chartWidth: 8,
      chartHeight: 6,
      aspectLocked: false,
      chart: createBlankChart(8, 6),
      paletteManuallyEdited: true,
    };
  }

  it("shows the chart and color key without a photo", async () => {
    const project = blankProject();

    render(
      <Studio
        {...studioProps}
        project={project}
        onProjectChange={async () => undefined}
      />,
    );

    expect(
      screen.getByRole("img", { name: /8 by 6 stitch colorwork chart/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^export$/i })).toBeEnabled();
    expect(screen.queryByLabelText(/maximum colors/i)).not.toBeInTheDocument();
  });

  it("resizes the grid, keeps counts honest, and undoes as one step", async () => {
    const user = userEvent.setup();
    const project = blankProject();
    let latest = project;
    const onProjectChange = vi.fn(async (next) => {
      latest = next;
    });

    render(
      <Studio
        {...studioProps}
        project={project}
        onProjectChange={onProjectChange}
      />,
    );

    fireEvent.change(screen.getByLabelText(/stitch width/i), {
      target: { value: "12" },
    });

    await waitFor(() => {
      expect(latest.chart?.width).toBe(12);
    });
    expect(latest.chartWidth).toBe(12);
    expect(latest.chart?.height).toBe(6);
    expect(latest.chart?.cells).toHaveLength(12 * 6);
    expect(
      latest.chart?.palette.reduce((sum, entry) => sum + entry.stitchCount, 0),
    ).toBe(12 * 6);

    await user.click(screen.getByRole("button", { name: /^undo$/i }));
    await waitFor(() => {
      expect(latest.chart?.width).toBe(8);
    });
    // The field has to follow the chart, or it would describe a grid that was
    // undone away.
    expect(latest.chartWidth).toBe(8);
    expect(screen.getByLabelText(/stitch width/i)).toHaveValue(8);
  });

  it("saves and reopens at its edited size", async () => {
    const repository = await createLocalRepository(
      `knit-pro-blank-${crypto.randomUUID()}`,
    );
    const project = blankProject();
    await repository.savePatternProject(project);

    const onProjectChange = vi.fn(async (next) => {
      await repository.savePatternProject(next);
    });

    const { unmount } = render(
      <Studio
        {...studioProps}
        project={project}
        onProjectChange={onProjectChange}
      />,
    );

    fireEvent.change(screen.getByLabelText(/row height/i), {
      target: { value: "10" },
    });
    await waitFor(async () => {
      expect((await repository.getPatternProject(project.id))?.chart?.height).toBe(
        10,
      );
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

    expect(
      screen.getByRole("img", { name: /8 by 10 stitch colorwork chart/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^export$/i })).toBeEnabled();
  });

  it("adds a color, paints a stitch with it, and undoes the stroke", async () => {
    const user = userEvent.setup();
    const project = blankProject();
    let latest = project;
    const onProjectChange = vi.fn(async (next) => {
      latest = next;
    });

    render(
      <Studio
        {...studioProps}
        project={project}
        onProjectChange={onProjectChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add color to key/i }));
    await waitFor(() => {
      expect(latest.chart?.palette).toHaveLength(2);
    });

    // Add arms paint on the new color — no second paint-bar click needed.
    expect(
      screen.getByRole("button", { name: /paint with ● added color/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: /edit ●/i })).toBeInTheDocument();

    // The keyboard path stands in for a pointer here, and is the accessible
    // route in its own right.
    screen.getByRole("group", { name: /chart paint area/i }).focus();
    await user.keyboard("{ArrowRight}{ArrowDown}{Enter}");

    await waitFor(() => {
      expect(latest.chart?.cells[1 * 8 + 1]).toBe(1);
    });
    expect(latest.chart?.palette[1]?.stitchCount).toBe(1);
    expect(latest.chart?.palette[0]?.stitchCount).toBe(8 * 6 - 1);
    expect(latest.paletteManuallyEdited).toBe(true);

    await user.click(screen.getByRole("button", { name: /^undo$/i }));
    await waitFor(() => {
      expect(latest.chart?.cells[1 * 8 + 1]).toBe(0);
    });
    expect(latest.chart?.palette[0]?.stitchCount).toBe(8 * 6);
  });

  it("keeps paint bar and Color Key on one shared selection", async () => {
    const user = userEvent.setup();
    const project = blankProject();
    let latest = project;
    const onProjectChange = vi.fn(async (next) => {
      latest = next;
    });

    render(
      <Studio
        {...studioProps}
        project={project}
        onProjectChange={onProjectChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add color to key/i }));
    await waitFor(() => {
      expect(latest.chart?.palette).toHaveLength(2);
    });

    const keyRow = screen.getByRole("button", {
      name: /select ● added color/i,
    });
    // Add already selected the new color for paint + edit.
    expect(keyRow).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /paint with ● added color/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("group", { name: /chart paint area/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /edit ●/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^pan$/i }));

    expect(keyRow).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("button", { name: /paint with ● added color/i }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("group", { name: /chart pan and zoom area/i }),
    ).toBeInTheDocument();
    // Edit keeps the last armed color while Pan clears the shared highlight.
    expect(screen.getByRole("heading", { name: /edit ●/i })).toBeInTheDocument();
  });

  it("asks before generating over a hand-drawn chart when a photo arrives", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const confirmRegeneration = vi.fn(() => false);
    stubGenerate.mockClear();

    render(
      <Studio
        {...studioProps}
        project={blankProject()}
        onProjectChange={async () => undefined}
        confirmRegeneration={confirmRegeneration}
      />,
    );

    await user.upload(
      screen.getByLabelText(/choose a photo|replace photo/i),
      new File([tinyPng], "fox.png", { type: "image/png" }),
    );
    await vi.advanceTimersByTimeAsync(350);

    expect(confirmRegeneration).toHaveBeenCalled();
    expect(stubGenerate).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { createEmptyPatternProject } from "./domain/models";
import { createLocalRepository } from "./repository/local-repository";

describe("Studio shell", () => {
  it("lets a Knitter create a Pattern Project without an account and see the Studio layout", async () => {
    const user = userEvent.setup();
    const repository = await createLocalRepository(
      `knit-pro-ui-${crypto.randomUUID()}`,
    );

    render(<App repository={repository} />);

    expect(
      screen.getByText(/stored only on this device/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /new pattern project/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /untitled pattern/i })).toBeInTheDocument();
    });

    expect(screen.getByRole("region", { name: /image controls/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /colorwork chart/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /color key/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^undo$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^redo$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^export$/i })).toBeInTheDocument();

    const projects = await repository.listPatternProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0]?.name).toBe("Untitled pattern");
  });

  it("shows an empty local project list until a Pattern Project is created", async () => {
    const repository = await createLocalRepository(
      `knit-pro-ui-${crypto.randomUUID()}`,
    );

    render(<App repository={repository} />);

    expect(
      await screen.findByText(/no pattern projects yet/i),
    ).toBeInTheDocument();
  });
});

describe("Project library management", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function seededApp(names: string[]) {
    const repository = await createLocalRepository(
      `knit-pro-ui-${crypto.randomUUID()}`,
    );
    for (const name of names) {
      await repository.savePatternProject(createEmptyPatternProject(name));
    }
    render(<App repository={repository} />);
    return repository;
  }

  it("renames a local Pattern Project", async () => {
    const user = userEvent.setup();
    const repository = await seededApp(["Fox"]);

    await user.click(await screen.findByRole("button", { name: /rename fox/i }));
    const input = screen.getByLabelText(/new name for fox/i);
    await user.clear(input);
    await user.type(input, "Arctic fox");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /^arctic fox$/i }),
      ).toBeInTheDocument(),
    );
    const saved = await repository.listPatternProjects();
    expect(saved.map((project) => project.name)).toContain("Arctic fox");
  });

  it("duplicates a Pattern Project into an independent copy", async () => {
    const user = userEvent.setup();
    const repository = await seededApp(["Fox"]);

    await user.click(
      await screen.findByRole("button", { name: /duplicate fox/i }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /^fox \(copy\)$/i }),
      ).toBeInTheDocument(),
    );
    expect(await repository.listPatternProjects()).toHaveLength(2);
  });

  it("deletes a Pattern Project after confirmation", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const repository = await seededApp(["Fox", "Leaves"]);

    await user.click(await screen.findByRole("button", { name: /delete fox/i }));

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /^fox$/i }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /^leaves$/i })).toBeInTheDocument();
    expect(await repository.listPatternProjects()).toHaveLength(1);
  });

  it("keeps a Pattern Project when deletion is not confirmed", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    await seededApp(["Fox"]);

    await user.click(await screen.findByRole("button", { name: /delete fox/i }));

    expect(screen.getByRole("button", { name: /^fox$/i })).toBeInTheDocument();
  });
});

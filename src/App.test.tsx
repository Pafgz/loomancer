import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";
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
    expect(screen.getByRole("button", { name: /export pattern/i })).toBeInTheDocument();

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

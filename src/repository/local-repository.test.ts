import { describe, expect, it } from "vitest";
import {
  createEmptyPatternProject,
  createYarnColor,
  PATTERN_PROJECT_SCHEMA_VERSION,
  YARN_INVENTORY_SCHEMA_VERSION,
} from "../domain/models";
import { createLocalRepository } from "./local-repository";

describe("local repository", () => {
  it("creates a Pattern Project without an account and reloads it with schema version", async () => {
    const repository = await createLocalRepository(`knit-pro-${crypto.randomUUID()}`);
    const project = createEmptyPatternProject("Mountain fox");

    await repository.savePatternProject(project);

    const reloaded = await repository.getPatternProject(project.id);
    expect(reloaded).toEqual(project);
    expect(reloaded?.schemaVersion).toBe(PATTERN_PROJECT_SCHEMA_VERSION);
  });

  it("lists saved Pattern Projects", async () => {
    const repository = await createLocalRepository(`knit-pro-${crypto.randomUUID()}`);
    const first = createEmptyPatternProject("Fox");
    const second = createEmptyPatternProject("Leaves");

    await repository.savePatternProject(first);
    await repository.savePatternProject(second);

    const listed = await repository.listPatternProjects();
    expect(listed.map((project) => project.name).sort()).toEqual([
      "Fox",
      "Leaves",
    ]);
  });

  it("deletes a Pattern Project without touching the others", async () => {
    const repository = await createLocalRepository(
      `knit-pro-${crypto.randomUUID()}`,
    );
    const keep = createEmptyPatternProject("Keep");
    const remove = createEmptyPatternProject("Remove");
    await repository.savePatternProject(keep);
    await repository.savePatternProject(remove);

    await repository.deletePatternProject(remove.id);

    const listed = await repository.listPatternProjects();
    expect(listed.map((project) => project.name)).toEqual(["Keep"]);
    expect(await repository.getPatternProject(remove.id)).toBeUndefined();
  });

  it("round-trips the craft of a cross-stitch Pattern Project", async () => {
    const repository = await createLocalRepository(
      `knit-pro-${crypto.randomUUID()}`,
    );
    const project = createEmptyPatternProject("Sampler", "cross-stitch");

    await repository.savePatternProject(project);

    expect((await repository.getPatternProject(project.id))?.craftType).toBe(
      "cross-stitch",
    );
  });

  it("reopens a pre-craft record as knitting at the current schema version", async () => {
    const repository = await createLocalRepository(
      `knit-pro-${crypto.randomUUID()}`,
    );
    const { craftType: _craftType, ...legacy } = createEmptyPatternProject(
      "Mountain fox",
    );

    // Written the way an older build would have: no craftType, older version.
    await repository.savePatternProject({
      ...legacy,
      schemaVersion: 4,
    } as never);

    const reloaded = await repository.getPatternProject(legacy.id);
    expect(reloaded?.craftType).toBe("knitting");
    expect(reloaded?.schemaVersion).toBe(PATTERN_PROJECT_SCHEMA_VERSION);
  });

  it("stores Yarn Inventory colors with schema version across reloads", async () => {
    const repository = await createLocalRepository(`knit-pro-${crypto.randomUUID()}`);
    const yarn = createYarnColor("Forest green", "#263e36");

    await repository.saveYarnColor(yarn);

    const listed = await repository.listYarnColors();
    expect(listed).toEqual([yarn]);
    expect(listed[0]?.schemaVersion).toBe(YARN_INVENTORY_SCHEMA_VERSION);
  });

  it("persists a source image Blob with crop and rotation for reopen", async () => {
    const repository = await createLocalRepository(
      `knit-pro-${crypto.randomUUID()}`,
    );
    const sourceImage = new Blob([Uint8Array.from([1, 2, 3, 4])], {
      type: "image/png",
    });
    const project = {
      ...createEmptyPatternProject("Mountain fox"),
      sourceImage,
      sourceFileName: "fox.png",
      sourceMimeType: "image/png",
      naturalWidth: 1200,
      naturalHeight: 800,
      rotationDegrees: 90 as const,
      crop: { x: 10, y: 20, width: 400, height: 300 },
    };

    await repository.savePatternProject(project);
    const reloaded = await repository.getPatternProject(project.id);

    expect(reloaded?.sourceFileName).toBe("fox.png");
    expect(reloaded?.sourceMimeType).toBe("image/png");
    expect(reloaded?.naturalWidth).toBe(1200);
    expect(reloaded?.naturalHeight).toBe(800);
    expect(reloaded?.rotationDegrees).toBe(90);
    expect(reloaded?.crop).toEqual({ x: 10, y: 20, width: 400, height: 300 });
    expect(reloaded?.sourceImage).toBeInstanceOf(Blob);
    expect(await reloaded?.sourceImage?.arrayBuffer()).toEqual(
      await sourceImage.arrayBuffer(),
    );
  });
});

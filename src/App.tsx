import { useEffect, useState, type FormEvent } from "react";
import { createBlankChart } from "./chart/blank-chart";
import { createWorkerChartGenerator } from "./chart/chart-generator";
import {
  createEmptyPatternProject,
  DEFAULT_CHART_HEIGHT,
  DEFAULT_CHART_WIDTH,
  duplicatePatternProject,
  nextDuplicateName,
  type PatternProject,
  type YarnColor,
} from "./domain/models";
import type { LocalRepository } from "./repository/local-repository";
import { BrandMark } from "./ui/BrandMark";
import {
  NewProjectDialog,
  type NewProjectRequest,
} from "./ui/NewProjectDialog";
import {
  describeStorageError,
  ensurePersistentStorage,
} from "./repository/storage-errors";
import { Studio } from "./ui/Studio";
import { ThemeToggle } from "./ui/ThemeToggle";

const DEFAULT_PROJECT_NAME = "Untitled pattern";

type AppProps = {
  repository: LocalRepository;
};

const generateChart = createWorkerChartGenerator();

export function App({ repository }: AppProps) {
  const [projects, setProjects] = useState<PatternProject[]>([]);
  const [inventory, setInventory] = useState<YarnColor[]>([]);
  const [activeProject, setActiveProject] = useState<PatternProject | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      repository.listPatternProjects(),
      repository.listYarnColors(),
    ]).then(([listedProjects, listedInventory]) => {
      if (!cancelled) {
        setProjects(listedProjects);
        setInventory(listedInventory);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [repository]);

  async function refreshProjects() {
    setProjects(await repository.listPatternProjects());
  }

  async function handleCreateProject(request: NewProjectRequest) {
    setCreating(false);
    const base = createEmptyPatternProject(request.name, request.craftType);
    const project: PatternProject =
      request.start === "blank"
        ? {
            ...base,
            chartWidth: request.chartWidth,
            chartHeight: request.chartHeight,
            aspectLocked: false,
            chart: createBlankChart(request.chartWidth, request.chartHeight),
            // A hand-drawn grid is work in its own right, so adding a photo
            // later must ask before generating over it.
            paletteManuallyEdited: true,
          }
        : base;
    try {
      await repository.savePatternProject(project);
      setStorageError(null);
      void ensurePersistentStorage();
      await refreshProjects();
    } catch (error) {
      setStorageError(describeStorageError(error));
    }
    setActiveProject(project);
  }

  async function handleProjectChange(project: PatternProject) {
    // Keep the in-memory project current first, so a failed save never drops
    // the knitter's work or the chart they are looking at.
    setActiveProject(project);
    try {
      await repository.savePatternProject(project);
      setStorageError(null);
      void ensurePersistentStorage();
      await refreshProjects();
    } catch (error) {
      setStorageError(describeStorageError(error));
    }
  }

  async function handleInventoryChange(next: YarnColor[]) {
    try {
      for (const yarn of next) {
        await repository.saveYarnColor(yarn);
      }
      setStorageError(null);
      setInventory(await repository.listYarnColors());
    } catch (error) {
      setStorageError(describeStorageError(error));
      setInventory(next);
    }
  }

  async function handleRename(project: PatternProject, nextName: string) {
    const name = nextName.trim();
    setRenamingId(null);
    if (!name || name === project.name) {
      return;
    }
    const renamed = {
      ...project,
      name,
      updatedAt: new Date().toISOString(),
    };
    try {
      await repository.savePatternProject(renamed);
      setStorageError(null);
      await refreshProjects();
    } catch (error) {
      setStorageError(describeStorageError(error));
    }
  }

  async function handleDuplicate(project: PatternProject) {
    const source = (await repository.getPatternProject(project.id)) ?? project;
    const listed = await repository.listPatternProjects();
    const copy = duplicatePatternProject(
      source,
      nextDuplicateName(
        source.name,
        listed.map((entry) => entry.name),
      ),
    );
    try {
      await repository.savePatternProject(copy);
      setStorageError(null);
      await refreshProjects();
    } catch (error) {
      setStorageError(describeStorageError(error));
    }
  }

  async function handleDelete(project: PatternProject) {
    const confirmed = window.confirm(
      `Delete "${project.name}"? This can't be undone.`,
    );
    if (!confirmed) {
      return;
    }
    try {
      await repository.deletePatternProject(project.id);
      setStorageError(null);
      await refreshProjects();
    } catch (error) {
      setStorageError(describeStorageError(error));
    }
  }

  if (activeProject) {
    return (
      <Studio
        project={activeProject}
        inventory={inventory}
        onBack={() => setActiveProject(null)}
        onProjectChange={handleProjectChange}
        onInventoryChange={handleInventoryChange}
        generateChart={generateChart}
      />
    );
  }

  return (
    <div className="home">
      <header className="home-header">
        <div className="brand-mark">
          <BrandMark />
          <div className="header-titles">
            <p className="brand">Yarnlane</p>
            <h1>Pattern Projects</h1>
          </div>
        </div>
        <div className="actions">
          <ThemeToggle />
          <button
            type="button"
            className="primary"
            onClick={() => setCreating(true)}
          >
            New Pattern Project
          </button>
        </div>
      </header>

      <main className="home-main">
        <p className="storage-warning" role="note">
          <span aria-hidden="true">⛭</span>
          Stored only on this device/browser; not synchronized or backed up.
        </p>

        {storageError ? (
          <p className="form-error" role="alert">
            <span aria-hidden="true">⚠</span>
            {storageError}
          </p>
        ) : null}

        <section className="project-list" aria-label="Local Pattern Projects">
          {loading ? (
            <p className="muted">Loading local projects…</p>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <strong>No Pattern Projects yet.</strong>
              <span className="muted">
                Create one to turn a photo into a Colorwork Chart.
              </span>
            </div>
          ) : (
            <ul>
              {projects.map((project) => (
                <li key={project.id} className="project-card">
                  {renamingId === project.id ? (
                    <form
                      className="rename-form"
                      onSubmit={(event: FormEvent) => {
                        event.preventDefault();
                        void handleRename(project, renameValue);
                      }}
                    >
                      <input
                        autoFocus
                        value={renameValue}
                        aria-label={`New name for ${project.name}`}
                        onChange={(event) => setRenameValue(event.target.value)}
                      />
                      <div className="actions">
                        <button type="submit" className="primary">
                          Save
                        </button>
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => setRenamingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="project-link"
                        onClick={() => setActiveProject(project)}
                      >
                        {project.name}
                      </button>
                      <div className="project-card-actions">
                        <button
                          type="button"
                          className="ghost"
                          aria-label={`Rename ${project.name}`}
                          onClick={() => {
                            setRenamingId(project.id);
                            setRenameValue(project.name);
                          }}
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          className="ghost"
                          aria-label={`Duplicate ${project.name}`}
                          onClick={() => void handleDuplicate(project)}
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          className="ghost"
                          aria-label={`Delete ${project.name}`}
                          onClick={() => void handleDelete(project)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {creating ? (
        <NewProjectDialog
          defaultName={DEFAULT_PROJECT_NAME}
          defaultWidth={DEFAULT_CHART_WIDTH}
          defaultHeight={DEFAULT_CHART_HEIGHT}
          onCancel={() => setCreating(false)}
          onCreate={(request) => void handleCreateProject(request)}
        />
      ) : null}
    </div>
  );
}

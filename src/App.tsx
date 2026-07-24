import { useEffect, useState } from "react";
import { createWorkerChartGenerator } from "./chart/chart-generator";
import {
  createEmptyPatternProject,
  type PatternProject,
  type YarnColor,
} from "./domain/models";
import type { LocalRepository } from "./repository/local-repository";
import { Studio } from "./ui/Studio";

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

  async function handleCreateProject() {
    const project = createEmptyPatternProject("Untitled pattern");
    await repository.savePatternProject(project);
    await refreshProjects();
    setActiveProject(project);
  }

  async function handleProjectChange(project: PatternProject) {
    await repository.savePatternProject(project);
    setActiveProject(project);
    await refreshProjects();
  }

  async function handleInventoryChange(next: YarnColor[]) {
    for (const yarn of next) {
      await repository.saveYarnColor(yarn);
    }
    setInventory(await repository.listYarnColors());
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
        <div>
          <p className="brand">Knit-Pro</p>
          <h1>Pattern Projects</h1>
        </div>
        <button type="button" className="primary" onClick={handleCreateProject}>
          New Pattern Project
        </button>
      </header>

      <p className="storage-warning" role="note">
        Stored only on this device/browser; not synchronized or backed up.
      </p>

      <section className="project-list" aria-label="Local Pattern Projects">
        {loading ? (
          <p>Loading local projects…</p>
        ) : projects.length === 0 ? (
          <p>No Pattern Projects yet.</p>
        ) : (
          <ul>
            {projects.map((project) => (
              <li key={project.id}>
                <button
                  type="button"
                  className="project-link"
                  onClick={() => setActiveProject(project)}
                >
                  {project.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

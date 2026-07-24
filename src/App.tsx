import { useEffect, useState } from "react";
import {
  createWorkerChartGenerator,
} from "./chart/chart-generator";
import {
  createEmptyPatternProject,
  type PatternProject,
} from "./domain/models";
import type { LocalRepository } from "./repository/local-repository";
import { Studio } from "./ui/Studio";

type AppProps = {
  repository: LocalRepository;
};

const generateChart = createWorkerChartGenerator();

export function App({ repository }: AppProps) {
  const [projects, setProjects] = useState<PatternProject[]>([]);
  const [activeProject, setActiveProject] = useState<PatternProject | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void repository.listPatternProjects().then((listed) => {
      if (!cancelled) {
        setProjects(listed);
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

  if (activeProject) {
    return (
      <Studio
        project={activeProject}
        onBack={() => setActiveProject(null)}
        onProjectChange={handleProjectChange}
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

import type { PatternProject } from "../domain/models";

type StudioProps = {
  project: PatternProject;
  onBack: () => void;
};

export function Studio({ project, onBack }: StudioProps) {
  return (
    <div className="studio">
      <header className="studio-header">
        <div>
          <button type="button" className="ghost" onClick={onBack}>
            All projects
          </button>
          <h1>{project.name}</h1>
          <p className="muted">Local Pattern Project</p>
        </div>
        <div className="actions">
          <button type="button" disabled>
            Undo
          </button>
          <button type="button" disabled>
            Redo
          </button>
          <button type="button" className="primary" disabled>
            Save Knit-ready Pattern
          </button>
        </div>
      </header>

      <div className="studio-layout">
        <section className="panel" aria-label="Image controls">
          <h2>Image controls</h2>
          <p className="muted">
            Select a photo, crop it, and set chart detail in the next slice.
          </p>
        </section>

        <section className="chart-stage" aria-label="Colorwork Chart">
          <h2 className="visually-hidden">Colorwork Chart</h2>
          <p className="muted">Chart preview will appear here after generation.</p>
        </section>

        <section className="panel" aria-label="Color key">
          <h2>Color key</h2>
          <p className="muted">
            Chart colors and Yarn Inventory matches will appear here.
          </p>
        </section>
      </div>
    </div>
  );
}

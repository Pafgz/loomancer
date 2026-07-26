import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  clampChartDimension,
  MAX_CHART_DIMENSION,
  MIN_CHART_DIMENSION,
} from "../chart/chart-types";
import type { CraftType } from "../domain/models";

export type NewProjectStart = "photo" | "blank";

export type NewProjectRequest = {
  name: string;
  craftType: CraftType;
  start: NewProjectStart;
  chartWidth: number;
  chartHeight: number;
};

type NewProjectDialogProps = {
  defaultName: string;
  defaultWidth: number;
  defaultHeight: number;
  onCancel: () => void;
  onCreate: (request: NewProjectRequest) => void;
};

const CRAFT_CHOICES: ReadonlyArray<{
  value: CraftType;
  label: string;
  hint: string;
}> = [
  {
    value: "knitting",
    label: "Knitting",
    hint: "Stitch 1 at the right, row 1 at the bottom, counting lines every 5.",
  },
  {
    value: "cross-stitch",
    label: "Cross-stitch",
    hint: "Numbered from the top left with center markers, counting lines every 10.",
  },
];

const START_CHOICES: ReadonlyArray<{
  value: NewProjectStart;
  label: string;
  hint: string;
}> = [
  {
    value: "photo",
    label: "A photo",
    hint: "Frame an image and generate the chart from it.",
  },
  {
    value: "blank",
    label: "A blank grid",
    hint: "Start from one solid color and paint the motif by hand.",
  },
];

/**
 * Craft cannot be changed once a project exists, so creation is a deliberate
 * step rather than a single click. Modal because that choice is permanent and
 * should not be made half-attentively behind other work.
 */
export function NewProjectDialog({
  defaultName,
  defaultWidth,
  defaultHeight,
  onCancel,
  onCreate,
}: NewProjectDialogProps) {
  const [name, setName] = useState(defaultName);
  const [craftType, setCraftType] = useState<CraftType>("knitting");
  const [start, setStart] = useState<NewProjectStart>("photo");
  const [width, setWidth] = useState(String(defaultWidth));
  const [height, setHeight] = useState(String(defaultHeight));

  const panelRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const craftHintId = useId();

  // Send focus to the first field rather than leaving the knitter or stitcher
  // on whatever was behind the dialog.
  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== "Tab") {
      return;
    }

    // A modal owns focus, so Tab cycles inside it instead of escaping to the
    // inert home screen behind.
    const focusable = focusableItems(panelRef.current);
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    onCreate({
      name: trimmed || defaultName,
      craftType,
      start,
      chartWidth: clampChartDimension(Number(width)),
      chartHeight: clampChartDimension(Number(height)),
    });
  }

  return (
    <div
      className="dialog-scrim"
      // A click on the backdrop is an unambiguous "not now"; the permanent
      // choice is still protected because Escape and Cancel do the same thing.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        ref={panelRef}
        className="dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
      >
        <h2 id={titleId}>New Pattern Project</h2>

        <form className="dialog-form" onSubmit={onSubmit}>
          <label className="field">
            <span>Name</span>
            <input
              ref={nameRef}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <fieldset className="choice-group" aria-describedby={craftHintId}>
            <legend>Craft</legend>
            {CRAFT_CHOICES.map((choice) => (
              <label
                key={choice.value}
                className={
                  craftType === choice.value ? "choice is-selected" : "choice"
                }
              >
                <input
                  type="radio"
                  name="craft"
                  value={choice.value}
                  checked={craftType === choice.value}
                  onChange={() => setCraftType(choice.value)}
                />
                <span className="choice-text">
                  <span className="choice-label">{choice.label}</span>
                  <span className="choice-hint">{choice.hint}</span>
                </span>
              </label>
            ))}
            <p id={craftHintId} className="hint">
              Craft sets the chart conventions of the export and can't be
              changed after the project is created.
            </p>
          </fieldset>

          <fieldset className="choice-group">
            <legend>Start from</legend>
            {START_CHOICES.map((choice) => (
              <label
                key={choice.value}
                className={
                  start === choice.value ? "choice is-selected" : "choice"
                }
              >
                <input
                  type="radio"
                  name="start"
                  value={choice.value}
                  checked={start === choice.value}
                  onChange={() => setStart(choice.value)}
                />
                <span className="choice-text">
                  <span className="choice-label">{choice.label}</span>
                  <span className="choice-hint">{choice.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {start === "blank" ? (
            <div className="dialog-grid-size">
              <div className="crop-fields">
                <label>
                  <span>Stitches across</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={MIN_CHART_DIMENSION}
                    max={MAX_CHART_DIMENSION}
                    value={width}
                    onChange={(event) => setWidth(event.target.value)}
                  />
                </label>
                <label>
                  <span>Rows down</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={MIN_CHART_DIMENSION}
                    max={MAX_CHART_DIMENSION}
                    value={height}
                    onChange={(event) => setHeight(event.target.value)}
                  />
                </label>
              </div>
              <p className="hint">
                Up to {MAX_CHART_DIMENSION} each way. You can resize in the
                Studio.
              </p>
            </div>
          ) : null}

          <div className="dialog-actions">
            <button type="button" className="ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="primary">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function focusableItems(panel: HTMLElement | null): HTMLElement[] {
  if (!panel) {
    return [];
  }
  return Array.from(
    panel.querySelectorAll<HTMLElement>(
      'input:not(:disabled), button:not(:disabled), [href], select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.offsetParent !== null || element === panel);
}

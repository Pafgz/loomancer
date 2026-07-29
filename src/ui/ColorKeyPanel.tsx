import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { MAX_CHART_COLORS } from "../chart/chart-types";
import {
  findIndistinguishablePairs,
  mergeChartColors,
  rankYarnMatches,
  replaceChartColor,
} from "../chart/palette-edits";
import {
  createYarnColor,
  type ColorworkChart,
  type YarnColor,
} from "../domain/models";

type ColorKeyPanelProps = {
  chart: ColorworkChart;
  inventory: YarnColor[];
  /** Shared Studio selection; null means Pan — no Color Key row is highlighted. */
  selectedIndex: number | null;
  onSelectedIndexChange: (index: number | null) => void;
  onChartChange: (chart: ColorworkChart) => void;
  /** Adds a palette entry and arms paint on it; must not replace an existing color. */
  onAddPaletteColor: (hex: string) => void;
  onInventoryChange: (inventory: YarnColor[]) => void;
};

/**
 * Native `<input type="color">` commits on the DOM `change` event (picker
 * closed / OK). React's `onChange` tracks `input` and fires while dragging —
 * which would spam palette adds/replaces — so we listen to `change` only.
 */
function ColorCommitInput({
  value,
  ariaLabel,
  className,
  disabled,
  onCommit,
}: {
  value: string;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  onCommit: (hex: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  useEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }
    const handleChange = () => {
      onCommitRef.current(input.value);
    };
    input.addEventListener("change", handleChange);
    return () => input.removeEventListener("change", handleChange);
  }, []);

  return (
    <input
      ref={inputRef}
      type="color"
      className={className}
      defaultValue={value}
      aria-label={ariaLabel}
      disabled={disabled}
    />
  );
}

export function ColorKeyPanel({
  chart,
  inventory,
  selectedIndex,
  onSelectedIndexChange,
  onChartChange,
  onAddPaletteColor,
  onInventoryChange,
}: ColorKeyPanelProps) {
  const addColorInputRef = useRef<HTMLInputElement>(null);
  const onAddPaletteColorRef = useRef(onAddPaletteColor);
  onAddPaletteColorRef.current = onAddPaletteColor;
  const [yarnName, setYarnName] = useState("");
  const [yarnHex, setYarnHex] = useState("#244b3c");
  const [yarnQuantity, setYarnQuantity] = useState("");
  const canAddColor = chart.palette.length < MAX_CHART_COLORS;
  const selected =
    selectedIndex !== null ? (chart.palette[selectedIndex] ?? null) : null;
  const suggestions = useMemo(
    () => (selected ? rankYarnMatches(selected.hex, inventory) : []),
    [selected, inventory],
  );
  const similarPairs = useMemo(
    () => findIndistinguishablePairs(chart),
    [chart],
  );
  const canMerge = Boolean(selected) && chart.palette.length > 1;

  useEffect(() => {
    const input = addColorInputRef.current;
    if (!input) {
      return;
    }
    const handleChange = () => {
      onAddPaletteColorRef.current(input.value);
    };
    input.addEventListener("change", handleChange);
    return () => input.removeEventListener("change", handleChange);
  }, []);

  function applyReplace(paletteIndex: number, hex: string, yarnLabel?: string) {
    onChartChange(replaceChartColor(chart, paletteIndex, hex, yarnLabel));
  }

  function handleAddYarn(event: FormEvent) {
    event.preventDefault();
    if (!yarnName.trim()) {
      return;
    }
    const yarn = createYarnColor(yarnName.trim(), yarnHex);
    if (yarnQuantity.trim()) {
      yarn.quantity = yarnQuantity.trim();
    }
    onInventoryChange([...inventory, yarn]);
    setYarnName("");
    setYarnQuantity("");
  }

  return (
    <div className="color-key-panel">
      <div className="card">
        <div className="palette-header">
          <h3>Palette</h3>
          <button
            type="button"
            className="palette-add-button"
            aria-label="Add palette color"
            disabled={!canAddColor}
            onClick={() => addColorInputRef.current?.click()}
          >
            +
          </button>
          <input
            ref={addColorInputRef}
            type="color"
            className="visually-hidden"
            defaultValue="#244b3c"
            aria-label="New palette color"
            disabled={!canAddColor}
          />
        </div>
        {!canAddColor ? (
          <p className="muted">Palette is full ({MAX_CHART_COLORS} colors).</p>
        ) : null}
        <ol className="chart-key" aria-label="Editable color key">
          {chart.palette.map((entry) => (
            <li key={entry.index} className="color-row-item">
              <button
                type="button"
                className={
                  selectedIndex !== null && entry.index === selectedIndex
                    ? "color-row selected"
                    : "color-row"
                }
                aria-pressed={
                  selectedIndex !== null && entry.index === selectedIndex
                }
                aria-label={`Select ${entry.symbol} ${entry.yarnLabel ?? entry.hex}`}
                onClick={() => onSelectedIndexChange(entry.index)}
              >
                <span
                  className="swatch color-row-swatch"
                  style={{ background: entry.hex }}
                  aria-hidden="true"
                >
                  <span className="color-row-symbol">{entry.symbol}</span>
                </span>
                <span className="color-row-meta">
                  {entry.yarnLabel ? (
                    <span className="color-row-name">{entry.yarnLabel}</span>
                  ) : null}
                  <span className="color-row-hex">{entry.hex}</span>
                  <span className="color-row-count">
                    {entry.stitchCount} stitches
                  </span>
                </span>
              </button>
              <ColorCommitInput
                key={`${entry.index}-${entry.hex}`}
                className="color-row-edit"
                value={entry.hex}
                ariaLabel={`Change color for ${entry.symbol} ${entry.yarnLabel ?? entry.hex}`}
                onCommit={(hex) =>
                  applyReplace(entry.index, hex, "Custom color")
                }
              />
            </li>
          ))}
        </ol>

        {selected && canMerge ? (
          <label className="palette-merge">
            Merge into
            <select
              aria-label="Merge into color"
              defaultValue=""
              onChange={(event) => {
                const target = Number(event.target.value);
                if (Number.isFinite(target)) {
                  onChartChange(
                    mergeChartColors(chart, selected.index, target),
                  );
                  onSelectedIndexChange(0);
                }
                event.target.value = "";
              }}
            >
              <option value="" disabled>
                Choose a color
              </option>
              {chart.palette
                .filter((entry) => entry.index !== selected.index)
                .map((entry) => (
                  <option key={entry.index} value={entry.index}>
                    {entry.symbol}{" "}
                    {entry.yarnLabel
                      ? `${entry.yarnLabel} (${entry.hex})`
                      : entry.hex}
                  </option>
                ))}
            </select>
          </label>
        ) : null}

        {selected ? (
          <div className="palette-matches">
            <p className="section-label">Yarn matches</p>
            <p className="muted">
              Suggestions are not applied until you confirm. Quantity is
              informational only.
            </p>
            {suggestions.length === 0 ? (
              <p className="muted">Add Yarn Colors below to see matches.</p>
            ) : (
              <ul className="match-list">
                {suggestions.slice(0, 3).map((suggestion) => (
                  <li key={suggestion.yarn.id}>
                    <span
                      className="swatch"
                      style={{ background: suggestion.yarn.displayColor }}
                      aria-hidden="true"
                    />
                    <span>
                      {suggestion.yarn.name} · {suggestion.quality}
                      {suggestion.yarn.quantity
                        ? ` · qty ${suggestion.yarn.quantity}`
                        : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        applyReplace(
                          selected.index,
                          suggestion.yarn.displayColor,
                          suggestion.yarn.name,
                        )
                      }
                    >
                      Use this yarn
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      {similarPairs.length > 0 ? (
        <div className="similar-warning" role="status">
          <p>
            Some chart colors look hard to distinguish. Merge only if you want
            to.
          </p>
          {similarPairs.slice(0, 2).map((pair) => (
            <button
              key={`${pair.leftIndex}-${pair.rightIndex}`}
              type="button"
              onClick={() =>
                onChartChange(
                  mergeChartColors(chart, pair.leftIndex, pair.rightIndex),
                )
              }
            >
              Merge {chart.palette[pair.leftIndex]?.symbol} into{" "}
              {chart.palette[pair.rightIndex]?.symbol}
            </button>
          ))}
        </div>
      ) : null}

      <form className="yarn-form card" onSubmit={handleAddYarn}>
        <h3>Yarn Inventory</h3>
        <label>
          Name
          <input
            value={yarnName}
            onChange={(event) => setYarnName(event.target.value)}
            required
            aria-label="Yarn name"
          />
        </label>
        <label>
          Display color
          <input
            type="color"
            value={yarnHex}
            onChange={(event) => setYarnHex(event.target.value)}
            aria-label="Yarn display color"
          />
        </label>
        <label>
          Quantity (optional)
          <input
            value={yarnQuantity}
            onChange={(event) => setYarnQuantity(event.target.value)}
            aria-label="Yarn quantity"
            placeholder="Informational only"
          />
        </label>
        <button type="submit">Add Yarn Color</button>
      </form>

      {inventory.length === 0 ? (
        <p className="muted inventory-empty">
          No Yarn Colors yet. Add one to get match suggestions.
        </p>
      ) : (
        <ul className="inventory-list" aria-label="Yarn Inventory">
          {inventory.map((yarn) => (
            <li key={yarn.id}>
              <span
                className="swatch"
                style={{ background: yarn.displayColor }}
                aria-hidden="true"
              />
              <span>
                {yarn.name}
                {yarn.quantity ? ` · qty ${yarn.quantity}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

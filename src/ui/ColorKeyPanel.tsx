import { useEffect, useMemo, useState, type FormEvent } from "react";
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

export function ColorKeyPanel({
  chart,
  inventory,
  selectedIndex,
  onSelectedIndexChange,
  onChartChange,
  onAddPaletteColor,
  onInventoryChange,
}: ColorKeyPanelProps) {
  // While Pan is active, Edit still targets the last armed color (or palette[0]).
  const [editFocusIndex, setEditFocusIndex] = useState(0);
  const [customHex, setCustomHex] = useState("#244b3c");
  const [newColorHex, setNewColorHex] = useState("#244b3c");
  const [yarnName, setYarnName] = useState("");
  const [yarnHex, setYarnHex] = useState("#244b3c");
  const [yarnQuantity, setYarnQuantity] = useState("");
  const canAddColor = chart.palette.length < MAX_CHART_COLORS;

  useEffect(() => {
    if (selectedIndex !== null) {
      setEditFocusIndex(selectedIndex);
    }
  }, [selectedIndex]);

  useEffect(() => {
    setEditFocusIndex((current) =>
      current >= chart.palette.length ? 0 : current,
    );
  }, [chart.palette.length]);

  const editIndex = selectedIndex ?? editFocusIndex;
  const selected = chart.palette[editIndex] ?? chart.palette[0];
  const suggestions = useMemo(
    () => (selected ? rankYarnMatches(selected.hex, inventory) : []),
    [selected, inventory],
  );
  const similarPairs = useMemo(
    () => findIndistinguishablePairs(chart),
    [chart],
  );

  function applyReplace(hex: string, yarnLabel?: string) {
    if (!selected) {
      return;
    }
    onChartChange(replaceChartColor(chart, selected.index, hex, yarnLabel));
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
        <h3>Palette</h3>
        <ol className="chart-key" aria-label="Editable color key">
          {chart.palette.map((entry) => (
            <li key={entry.index}>
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
                  <span className="color-row-name">
                    {entry.yarnLabel ?? entry.hex}
                  </span>
                  <span className="color-row-count">
                    {entry.stitchCount} stitches
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="card">
        <h3>Add color</h3>
        <label>
          New color
          <input
            type="color"
            value={newColorHex}
            onChange={(event) => setNewColorHex(event.target.value)}
            aria-label="New palette color"
            disabled={!canAddColor}
          />
        </label>
        <button
          type="button"
          disabled={!canAddColor}
          onClick={() => onAddPaletteColor(newColorHex)}
        >
          Add color to key
        </button>
        {!canAddColor ? (
          <p className="muted">Palette is full ({MAX_CHART_COLORS} colors).</p>
        ) : (
          <p className="muted">
            Adds a new key entry and selects it for painting. Does not change
            existing colors.
          </p>
        )}
      </div>

      {selected ? (
        <div className="palette-actions card">
          <h3>Edit {selected.symbol}</h3>
          <label>
            Replacement color
            <input
              type="color"
              value={customHex}
              onChange={(event) => setCustomHex(event.target.value)}
              aria-label="Custom replacement color"
            />
          </label>
          <button
            type="button"
            onClick={() => applyReplace(customHex, "Custom color")}
          >
            Replace with custom color
          </button>
          <label>
            Merge into
            <select
              aria-label="Merge into color"
              defaultValue=""
              onChange={(event) => {
                const target = Number(event.target.value);
                if (Number.isFinite(target)) {
                  onChartChange(mergeChartColors(chart, selected.index, target));
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
                    {entry.symbol} {entry.yarnLabel ?? entry.hex}
                  </option>
                ))}
            </select>
          </label>

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

import { useMemo, useState, type FormEvent } from "react";
import {
  addChartColor,
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
  onChartChange: (chart: ColorworkChart) => void;
  onInventoryChange: (inventory: YarnColor[]) => void;
};

export function ColorKeyPanel({
  chart,
  inventory,
  onChartChange,
  onInventoryChange,
}: ColorKeyPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [customHex, setCustomHex] = useState("#244b3c");
  const [yarnName, setYarnName] = useState("");
  const [yarnHex, setYarnHex] = useState("#244b3c");
  const [yarnQuantity, setYarnQuantity] = useState("");

  const selected = chart.palette[selectedIndex] ?? chart.palette[0];
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
      <ol className="chart-key" aria-label="Editable color key">
        {chart.palette.map((entry) => (
          <li key={entry.index}>
            <button
              type="button"
              className={
                entry.index === selected?.index
                  ? "color-row selected"
                  : "color-row"
              }
              onClick={() => setSelectedIndex(entry.index)}
            >
              <span
                className="swatch"
                style={{ background: entry.hex }}
                aria-hidden="true"
              />
              <span>
                {entry.symbol} {entry.yarnLabel ?? entry.hex} ·{" "}
                {entry.stitchCount} stitches
              </span>
            </button>
          </li>
        ))}
      </ol>

      {selected ? (
        <div className="palette-actions">
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
                  setSelectedIndex(0);
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
          <button
            type="button"
            onClick={() =>
              onChartChange(addChartColor(chart, customHex, "Added color"))
            }
          >
            Add color to key
          </button>

          <h3>Suggested Yarn Inventory matches</h3>
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

      <form className="yarn-form" onSubmit={handleAddYarn}>
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
    </div>
  );
}

import { useMemo, useState, type FormEvent } from "react";
import { MAX_CHART_COLORS } from "../chart/chart-types";
import {
  findIndistinguishablePairs,
  mergeChartColors,
  previewChartColor,
  rankYarnMatches,
  replaceChartColor,
} from "../chart/palette-edits";
import {
  createYarnColor,
  type ColorworkChart,
  type YarnColor,
} from "../domain/models";
import { normalizeHex } from "./color-hex";
import { ImageEyedropper } from "./ImageEyedropper";

type ColorKeyPanelProps = {
  chart: ColorworkChart;
  inventory: YarnColor[];
  /** Shared Studio selection; null means Pan — no Color Key row is highlighted. */
  selectedIndex: number | null;
  onSelectedIndexChange: (index: number | null) => void;
  onChartChange: (chart: ColorworkChart) => void;
  /** Live hex overlay for the chart canvas — null clears the preview. */
  onPreviewChartChange?: (chart: ColorworkChart | null) => void;
  /** Adds a palette entry and arms paint on it; must not replace an existing color. */
  onAddPaletteColor: (hex: string) => void;
  onInventoryChange: (inventory: YarnColor[]) => void;
  /** Object URL for the Pattern Project source photo, when one exists. */
  sourceImageUrl?: string | null;
};

type ColorEditorSession =
  | { kind: "add" }
  | { kind: "edit"; index: number };

const DEFAULT_ADD_HEX = "#244b3c";

/**
 * Draft color controls: native swatch + editable hex + explicit commit.
 * Swatch/hex update a local draft (and optional live preview); Add/Apply commits.
 */
function ColorEditor({
  initialHex,
  groupLabel,
  applyLabel,
  onApply,
  onCancel,
  onDraftChange,
}: {
  initialHex: string;
  groupLabel: string;
  applyLabel: string;
  onApply: (hex: string) => void;
  onCancel: () => void;
  onDraftChange?: (hex: string) => void;
}) {
  const [swatchHex, setSwatchHex] = useState(initialHex);
  const [hexText, setHexText] = useState(initialHex);
  const normalized = normalizeHex(hexText);
  const canApply = normalized !== null;

  function publishDraft(hex: string) {
    onDraftChange?.(hex);
  }

  function handleSwatchChange(value: string) {
    setSwatchHex(value);
    setHexText(value);
    publishDraft(value);
  }

  function handleHexTextChange(value: string) {
    setHexText(value);
    const next = normalizeHex(value);
    if (next) {
      setSwatchHex(next);
      publishDraft(next);
    }
  }

  function handleApply() {
    if (!normalized) {
      return;
    }
    onApply(normalized);
  }

  return (
    <div className="color-editor" role="group" aria-label={groupLabel}>
      <input
        type="color"
        className="color-editor-swatch"
        value={swatchHex}
        aria-label="Color swatch"
        onChange={(event) => handleSwatchChange(event.target.value)}
      />
      <input
        type="text"
        className="color-editor-hex"
        value={hexText}
        aria-label="Hex"
        inputMode="text"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        placeholder="#000000"
        onChange={(event) => handleHexTextChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleApply();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
      />
      <button
        type="button"
        className="color-editor-apply"
        disabled={!canApply}
        onClick={handleApply}
      >
        {applyLabel}
      </button>
      <button
        type="button"
        className="color-editor-cancel"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}

export function ColorKeyPanel({
  chart,
  inventory,
  selectedIndex,
  onSelectedIndexChange,
  onChartChange,
  onPreviewChartChange,
  onAddPaletteColor,
  onInventoryChange,
  sourceImageUrl = null,
}: ColorKeyPanelProps) {
  const [editor, setEditor] = useState<ColorEditorSession | null>(null);
  const [liveEditHex, setLiveEditHex] = useState<string | null>(null);
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

  function clearPreview() {
    setLiveEditHex(null);
    onPreviewChartChange?.(null);
  }

  function publishEditPreview(index: number, hex: string) {
    setLiveEditHex(hex);
    onPreviewChartChange?.(previewChartColor(chart, index, hex));
  }

  function closeEditor() {
    clearPreview();
    setEditor(null);
  }

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

  function openAddEditor() {
    if (!canAddColor) {
      return;
    }
    clearPreview();
    setEditor({ kind: "add" });
  }

  function openEditEditor(index: number) {
    const entry = chart.palette[index];
    setLiveEditHex(entry?.hex ?? null);
    setEditor({ kind: "edit", index });
  }

  return (
    <div className="color-key-panel">
      <div className="card">
        <div className="palette-header">
          <h3>Palette</h3>
          <div className="palette-header-actions">
            <span className="palette-count hint" aria-live="polite">
              {chart.palette.length}/{MAX_CHART_COLORS}
            </span>
            <button
              type="button"
              className="palette-add-button"
              aria-label="Add palette color"
              aria-expanded={editor?.kind === "add"}
              disabled={!canAddColor}
              onClick={openAddEditor}
            >
              +
            </button>
          </div>
        </div>
        {!canAddColor ? (
          <p className="muted">Palette is full ({MAX_CHART_COLORS} colors).</p>
        ) : null}

        {editor?.kind === "add" ? (
          <ColorEditor
            key="add"
            initialHex={DEFAULT_ADD_HEX}
            groupLabel="Add palette color"
            applyLabel="Add"
            onApply={(hex) => {
              onAddPaletteColor(hex);
              closeEditor();
            }}
            onCancel={closeEditor}
          />
        ) : null}

        <ol className="chart-key" aria-label="Editable color key">
          {chart.palette.map((entry) => {
            const editingThis =
              editor?.kind === "edit" && editor.index === entry.index;
            const displayHex =
              editingThis && liveEditHex ? liveEditHex : entry.hex;
            return (
              <li key={entry.index} className="color-row-item">
                <div className="color-row-main">
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
                      style={{ background: displayHex }}
                      aria-hidden="true"
                    >
                      <span className="color-row-symbol">{entry.symbol}</span>
                    </span>
                    <span className="color-row-meta">
                      {entry.yarnLabel ? (
                        <span className="color-row-name">{entry.yarnLabel}</span>
                      ) : null}
                      <span className="color-row-hex">{displayHex}</span>
                      <span className="color-row-count">
                        {entry.stitchCount} stitches
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="color-row-edit"
                    aria-label={`Change color for ${entry.symbol} ${entry.yarnLabel ?? entry.hex}`}
                    aria-expanded={editingThis}
                    onClick={() => openEditEditor(entry.index)}
                  >
                    Edit
                  </button>
                </div>
                {editingThis ? (
                  <>
                    <ColorEditor
                      key={`edit-${entry.index}-${entry.hex}`}
                      initialHex={entry.hex}
                      groupLabel={`Edit color for ${entry.symbol}`}
                      applyLabel="Apply"
                      onDraftChange={(hex) =>
                        publishEditPreview(entry.index, hex)
                      }
                      onApply={(hex) => {
                        clearPreview();
                        applyReplace(entry.index, hex, "Custom color");
                        setEditor(null);
                      }}
                      onCancel={closeEditor}
                    />
                    {sourceImageUrl ? (
                      <ImageEyedropper
                        imageUrl={sourceImageUrl}
                        label="Pick from photo"
                        onPick={(hex) => {
                          clearPreview();
                          applyReplace(entry.index, hex, "From photo");
                          setEditor(null);
                        }}
                      />
                    ) : null}
                  </>
                ) : null}
              </li>
            );
          })}
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
              <button
                type="button"
                className="ghost"
                aria-label={`Delete ${yarn.name} from Yarn Inventory`}
                onClick={() =>
                  onInventoryChange(
                    inventory.filter((entry) => entry.id !== yarn.id),
                  )
                }
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

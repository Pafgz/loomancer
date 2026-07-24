export const PATTERN_PROJECT_SCHEMA_VERSION = 1;
export const YARN_INVENTORY_SCHEMA_VERSION = 1;

export type PatternProject = {
  id: string;
  name: string;
  schemaVersion: typeof PATTERN_PROJECT_SCHEMA_VERSION;
  createdAt: string;
  updatedAt: string;
};

export type YarnColor = {
  id: string;
  name: string;
  displayColor: string;
  brand?: string;
  line?: string;
  colorCode?: string;
  notes?: string;
  quantity?: string;
  schemaVersion: typeof YARN_INVENTORY_SCHEMA_VERSION;
};

export function createEmptyPatternProject(name: string): PatternProject {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    schemaVersion: PATTERN_PROJECT_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
  };
}

export function createYarnColor(
  name: string,
  displayColor: string,
): YarnColor {
  return {
    id: crypto.randomUUID(),
    name,
    displayColor,
    schemaVersion: YARN_INVENTORY_SCHEMA_VERSION,
  };
}

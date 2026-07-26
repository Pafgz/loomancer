import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import {
  DEFAULT_CRAFT_TYPE,
  PATTERN_PROJECT_SCHEMA_VERSION,
  type PatternProject,
  type YarnColor,
} from "../domain/models";

export const DEFAULT_DATABASE_NAME = "loomancer";
const DATABASE_VERSION = 3;

type StoredPatternProject = Omit<PatternProject, "sourceImage"> & {
  sourceImageBytes?: ArrayBuffer;
};

type LoomancerDb = DBSchema & {
  projects: {
    key: string;
    value: StoredPatternProject;
    indexes: { "by-updated": string };
  };
  inventory: {
    key: string;
    value: YarnColor;
    indexes: { "by-name": string };
  };
};

export type LocalRepository = {
  savePatternProject: (project: PatternProject) => Promise<void>;
  getPatternProject: (id: string) => Promise<PatternProject | undefined>;
  listPatternProjects: () => Promise<PatternProject[]>;
  deletePatternProject: (id: string) => Promise<void>;
  saveYarnColor: (yarn: YarnColor) => Promise<void>;
  listYarnColors: () => Promise<YarnColor[]>;
};

async function openLoomancerDb(
  databaseName: string,
): Promise<IDBPDatabase<LoomancerDb>> {
  return openDB<LoomancerDb>(databaseName, DATABASE_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("projects")) {
        const projects = database.createObjectStore("projects", {
          keyPath: "id",
        });
        projects.createIndex("by-updated", "updatedAt");
      }
      if (!database.objectStoreNames.contains("inventory")) {
        const inventory = database.createObjectStore("inventory", {
          keyPath: "id",
        });
        inventory.createIndex("by-name", "name");
      }
    },
  });
}

async function toStored(
  project: PatternProject,
): Promise<StoredPatternProject> {
  const { sourceImage, ...rest } = project;
  if (!sourceImage) {
    return rest;
  }

  return {
    ...rest,
    sourceImageBytes: await sourceImage.arrayBuffer(),
  };
}

function fromStored(stored: StoredPatternProject): PatternProject {
  const { sourceImageBytes, ...rest } = stored;
  const normalized: PatternProject = {
    ...rest,
    schemaVersion: PATTERN_PROJECT_SCHEMA_VERSION,
    craftType: rest.craftType ?? DEFAULT_CRAFT_TYPE,
    rotationDegrees: rest.rotationDegrees ?? 0,
    crop: rest.crop ?? null,
    detailLevel: rest.detailLevel ?? 6,
    chartWidth: rest.chartWidth ?? 48,
    chartHeight: rest.chartHeight ?? 36,
    aspectLocked: rest.aspectLocked ?? true,
    maxColors: rest.maxColors ?? 6,
    chart: rest.chart ?? null,
    paletteManuallyEdited: rest.paletteManuallyEdited ?? false,
    showChartSymbols: rest.showChartSymbols ?? true,
  };

  if (!sourceImageBytes) {
    return normalized;
  }

  return {
    ...normalized,
    sourceImage: new Blob([sourceImageBytes], {
      type: rest.sourceMimeType ?? "application/octet-stream",
    }),
  };
}

export async function createLocalRepository(
  databaseName: string = DEFAULT_DATABASE_NAME,
): Promise<LocalRepository> {
  const database = await openLoomancerDb(databaseName);

  return {
    async savePatternProject(project) {
      await database.put("projects", await toStored(project));
    },
    async getPatternProject(id) {
      const stored = await database.get("projects", id);
      return stored ? fromStored(stored) : undefined;
    },
    async listPatternProjects() {
      const stored = await database.getAllFromIndex("projects", "by-updated");
      return stored.map(fromStored);
    },
    async deletePatternProject(id) {
      await database.delete("projects", id);
    },
    async saveYarnColor(yarn) {
      await database.put("inventory", yarn);
    },
    async listYarnColors() {
      return database.getAllFromIndex("inventory", "by-name");
    },
  };
}

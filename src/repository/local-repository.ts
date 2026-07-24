import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { PatternProject, YarnColor } from "../domain/models";

export const DEFAULT_DATABASE_NAME = "knit-pro";
const DATABASE_VERSION = 1;

type KnitProDb = DBSchema & {
  projects: {
    key: string;
    value: PatternProject;
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
  saveYarnColor: (yarn: YarnColor) => Promise<void>;
  listYarnColors: () => Promise<YarnColor[]>;
};

async function openKnitProDb(
  databaseName: string,
): Promise<IDBPDatabase<KnitProDb>> {
  return openDB<KnitProDb>(databaseName, DATABASE_VERSION, {
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

export async function createLocalRepository(
  databaseName: string = DEFAULT_DATABASE_NAME,
): Promise<LocalRepository> {
  const database = await openKnitProDb(databaseName);

  return {
    async savePatternProject(project) {
      await database.put("projects", project);
    },
    async getPatternProject(id) {
      return database.get("projects", id);
    },
    async listPatternProjects() {
      return database.getAllFromIndex("projects", "by-updated");
    },
    async saveYarnColor(yarn) {
      await database.put("inventory", yarn);
    },
    async listYarnColors() {
      return database.getAllFromIndex("inventory", "by-name");
    },
  };
}

import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data", "sprout");
fs.mkdirSync(path.dirname(dataDir), { recursive: true });

const globalForDb = globalThis as typeof globalThis & {
  __sproutPglite?: PGlite;
};

export const client =
  globalForDb.__sproutPglite ??
  new PGlite(dataDir);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__sproutPglite = client;
}

export const db = drizzle(client);

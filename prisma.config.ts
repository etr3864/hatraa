import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import { normalizeDatabaseUrl } from "./backend/services/db/connection-string";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const databaseUrl = process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl ? normalizeDatabaseUrl(databaseUrl) : databaseUrl,
  },
});

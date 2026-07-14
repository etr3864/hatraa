import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js uses .env.local; Prisma defaults to .env — load both (local wins)
config({ path: ".env" });
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});

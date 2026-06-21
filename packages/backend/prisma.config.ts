import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import { resolve } from "path";

// Load .env from project root (two levels up from this file)
config({ path: resolve(__dirname, "../../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});

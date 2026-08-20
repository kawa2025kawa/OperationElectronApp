// scripts/bump-version.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const packageJsonPath = path.join(projectRoot, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

const versionParts = String(packageJson.version || "0.0.0")
  .replace(/^v/, "")
  .split(".")
  .map((num) => parseInt(num, 10) || 0);

const major = versionParts[0] ?? 0;
const minor = versionParts[1] ?? 0;
const patch = (versionParts[2] ?? 0) + 1;

const newVersion = `${major}.${minor}.${patch}`;

packageJson.version = newVersion;
fs.writeFileSync(
  packageJsonPath,
  JSON.stringify(packageJson, null, 2),
  "utf-8",
);
console.log(`[BumpVersion] Updated package.json version: ${newVersion}`);

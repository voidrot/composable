#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs-extra";
import * as path from "path";
import { fileURLToPath } from "node:url";

import { addFragment } from "./commands/add.js";
import { initStack, searchStacks } from "./commands/stack.js";
import { searchFragments } from "./commands/search.js";
import { manageCache, updateCache } from "./commands/cache.js";
import { showDocs } from "./commands/docs.js";
import { generateStack, testFragmentOrStack, initRegistry } from "./commands/dev.js";
import { upgradeFragments } from "./commands/upgrade.js";

const program = new Command();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_JSON_PATH = path.resolve(__dirname, "../../package.json");

function getCliVersion(): string {
  try {
    const pkg = fs.readJsonSync(PACKAGE_JSON_PATH) as { version?: string };
    return pkg.version ?? "0.1.0";
  } catch {
    return "0.1.0";
  }
}

program
  .name("composable")
  .description("Manage Docker Compose fragments and stacks")
  .version(getCliVersion());

program
  .command("add <type> <name>")
  .description("Add a fragment to your project")
  .option("-e, --extend", "Add the service directly to an existing compose.yml using extends syntax")
  .option("-n, --name <customName>", "Override the name of the service")
  .option("--gpu [driver]", "Specify the GPU driver type", "nvidia")
  .option("--gpu-count [count]", "Specify the GPU count", "all")
  .option("--build", "Add build configurations if present in the fragment")
  .option("--no-build", "Do not add build configurations if present in the fragment")
  .option("--watch", "Add watch configurations if present in the fragment")
  .option("--no-watch", "Do not add watch configurations if present in the fragment")
  .option("--env-file", "Add env_file configuration if present in the fragment")
  .option("--no-env-file", "Do not add env_file configuration if present in the fragment")
  .option("--restart <policy>", "Restart policy for the service", "unless-stopped")
  .action(addFragment);

const stackCmd = program.command("stack").description("Manage stacks of fragments");

stackCmd
  .command("init <name>")
  .description("Initialize a stack")
  .option("-e, --extend", "Extend an existing compose file", true)
  .option("--build", "Add build configurations if present in the fragments")
  .option("--no-build", "Do not add build configurations if present in the fragments")
  .option("--watch", "Add watch configurations if present in the fragments")
  .option("--no-watch", "Do not add watch configurations if present in the fragments")
  .option("--env-file", "Add env_file configuration if present in the fragments")
  .option("--no-env-file", "Do not add env_file configuration if present in the fragments")
  .action(initStack);

stackCmd
  .command("search [query]")
  .description("Search for stacks")
  .action(searchStacks);

program
  .command("search [query]")
  .description("Search for fragments")
  .action(searchFragments);

program
  .command("docs <type> <name>")
  .description("View documentation for a fragment or stack")
  .action(showDocs);

program
  .command("cache")
  .option("--all", "Cache all fragments")
  .description("Manage local cache")
  .action(manageCache);

program
  .command("update")
  .description("Update cached fragments from registry")
  .action(updateCache);

program
  .command("upgrade [name]")
  .description("Upgrade installed project fragments from the registry. Upgrades all fragments in .compose/ by default, or a single named fragment.")
  .option("-f, --force", "Overwrite even if content appears unchanged")
  .action(upgradeFragments);


const devCmd = program.command("dev").description("Developer utilities");

devCmd
  .command("generate-stack <compose-file>")
  .description("Generate a stack.json from an existing compose file")
  .action(generateStack);

devCmd
  .command("test <type> <name>")
  .description("Test a fragment or stack locally")
  .option("--run", "Run docker compose up after config validation")
  .action(testFragmentOrStack);

devCmd
  .command("init-registry [path]")
  .description("Initialize a custom registry template")
  .action(initRegistry);

program.parse();

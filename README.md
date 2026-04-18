# Composable

A structured, reusable library of Docker Compose configuration snippets and a streamlined command-line interface to manage them efficiently.

## Overview

Composable provides a centralized registry for useful Docker Compose "fragments" (like PostgreSQL, Redis, and Valkey) that you can quickly add to your projects. Instead of copying and pasting Docker Compose configurations from previous projects or tutorials, you can use the Composable CLI to fetch, combine, and configure them automatically.

## Features

- **Fragment Library**: High-quality, customizable Docker Compose configurations for common services.
- **CLI Tool**: Easily search and add fragments directly from your terminal.
- **Environment Variable Integration**: Automatically merges necessary default `.env` variables for added services.
- **GitHub Pages Registry**: A built-in system to deploy your fragment registry statically via GitHub Pages.

## Getting Started

### Install from npm

```bash
npm install -g @voidrot/composable
```

### Using the CLI

You can use the CLI to interact with the registry. For example:

```bash
# Search the registry for available fragments
composable search
composable search postgresql

# Add a fragment to your project
composable add compose postgresql

# Add a fragment and automatically extend it in your compose.yml
composable add compose redis --extend
```

When you add a fragment, it will be downloaded into your `./.compose` directory, and any required default environment variables will be automatically appended to your `.env` file.

## Local Development

If you are developing this tool locally:

```bash
# Install dependencies
npm install

# Build the CLI package
npm run build

# Build the local registry files (generates the /registry directory)
npm run build:registry

# Run the CLI locally
npx tsx src/cli/index.ts search
```

## Releases

Releases are automated with Release Please and Conventional Commits.

- Merge commits like `feat: ...`, `fix: ...`, and `feat!: ...` into `main`.
- Release Please opens or updates a release PR with version bumps and changelog updates.
- Publishing to npm runs when a GitHub release is published.

For publish-on-release automation to trigger, configure a token with permission to create releases for the Release Please workflow (for example, `RELEASE_PLEASE_TOKEN`).

## Adding New Fragments

1. Create a `.yml` file in the `fragments/compose/` directory (e.g., `my-service.yml`).
2. Run the metadata generator to create the accompanying `.json` file:

   ```bash
   npx tsx src/cli/index.ts init-metadata fragments/compose/my-service.yml
   ```

3. Open the generated `.json` file, add a description, and verify the detected variables.
4. Commit and push your changes. The GitHub Actions workflow will automatically rebuild the registry and deploy it.

## Registry Deployment

This repository is configured to automatically deploy its registry using GitHub Actions and GitHub Pages.

Whenever changes are pushed to the `main` branch, the `deploy.yml` workflow:

1. Restores the previously deployed registry state.
2. Builds and appends the new fragments.
3. Syncs the registry data back to the `gh-pages` branch for persistence.
4. Deploys the result to GitHub Pages, where it acts as the backend for the CLI.

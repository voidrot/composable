# Composable

A powerful, modular library of Docker Compose configuration fragments and a streamlined CLI to orchestrate them.

## Overview

Composable eliminates the "copy-paste" cycle of Docker development. It provides a centralized registry of verified "fragments" (like PostgreSQL, Redis, Django, and Celery) that you can instantly inject into your project. Use it to build clean, maintainable, and highly reproducible development environments.

## ✨ Features

- **🧱 Fragment Library**: High-quality, schema-validated Docker Compose snippets for common services.
- **📦 Pre-configured Stacks**: Initialize entire application ecosystems (e.g., `django-base`) with a single command.
- **🔄 Smart Build & Watch**: Automatically injects build contexts and Docker Compose `watch` configurations for hot-reloading.
- **🛡️ Environment Isolation**: Keeps your primary `.env` clean by routing service-specific variables to `.env.compose`.
- **🌍 Global Configuration**: Set organization-wide or personal defaults in `~/.composable/config.yml`.
- **📜 JSON Schema Validation**: Strict schema enforcement for both fragments and stacks to ensure stability.

## 🚀 Getting Started

### Install from npm

```bash
npm install -g @voidrot/composable
```

### Using the CLI

#### Search the Registry
```bash
# List all available fragments
composable search

# Search for a specific service
composable search postgresql
```

#### Add a Fragment
```bash
# Add postgresql and link it to your project
composable add compose postgresql --extend
```

#### Initialize a Stack
```bash
# Set up a complete Django + Postgres + Celery stack
composable stack init django-base
```

## ⚙️ Configuration

You can customize Composable globally by creating a config file at `~/.composable/config.yml`:

```yaml
registries:
  - name: default
    url: https://voidrot.github.io/composable/latest
defaults:
  env_file: true
  build: true
  watch: true
```

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Build the CLI
npm run build

# Validate all fragments and stacks against schemas
npm run validate

# Run the local CLI
npx tsx src/cli/index.ts --help
```

## 📖 Documentation

For detailed information on commands, fragments, and stacks, visit our documentation site:
**[https://voidrot.github.io/composable/latest/docs/](https://voidrot.github.io/composable/latest/docs/)**

## 🤝 Contributing

1. **Add a Fragment**: Place a `.yml` file in `fragments/compose/` and run `npm run validate`.
2. **Define a Stack**: Create a `.json` file in `stacks/` using the stack schema.
3. **Update Docs**: Run `node scripts/generate-docs.js` to refresh the documentation and navigation.

Releases are automated with **Release Please**. Use [Conventional Commits](https://www.conventionalcommits.org/) to trigger version bumps.


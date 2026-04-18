# CLI Command Reference

## `add <type> <name>`

Adds a fragment to the current project.

- **Type**: The category of the fragment (e.g., `compose`).
- **Name**: The name of the fragment (e.g., `postgresql`).
- **Options**:
  - `-e, --extend`: Add the service directly to an existing `compose.yml` using extends syntax.
  - `-n, --name <customName>`: Override the name of the service.
  - `--no-build`: Do not inject `build` configurations from the fragment into the `compose.yml`.
  - `--no-watch`: Do not inject `develop.watch` configurations from the fragment into the `compose.yml`.

## `stack init <name>`

Initializes a stack by adding all of its configured fragments.

- **Name**: The name of the stack (e.g., `django-base`).
- **Options**:
  - `-e, --extend`: Extend an existing compose file (enabled by default).
  - `--no-build`: Do not inject `build` configurations from the stack's fragments.
  - `--no-watch`: Do not inject `develop.watch` configurations from the stack's fragments.

## `search [query]`

Search for available fragments in the registry.

## `cache --all`

Download all available fragments to the local cache ($HOME/.composable/fragments).

## `update`

Update the local cache with the latest fragments from the registry.

## `upgrade [name]`

Upgrade already-installed fragments in the current project's `.compose/` directory to the latest version from the registry.

Unlike `update` (which only refreshes the global cache), `upgrade` directly overwrites the fragment files installed in your project and syncs any new environment variables to `.env.compose`.

- **Name** *(optional)*: Upgrade a single named fragment. If omitted, all fragments in `.compose/` are upgraded.
- **Options**:
  - `-f, --force`: Overwrite even if the content appears unchanged (useful to force an env var sync).

**Examples**:

```bash
# Upgrade all installed fragments
composable upgrade

# Upgrade only postgresql
composable upgrade postgresql

# Force overwrite even if unchanged
composable upgrade --force
```

## `init-metadata <path>`

**Developer Tool**: Scans a `.yml` file for `${VAR}` syntax and generates a corresponding `.json` metadata file.

## Global Configuration {#config}

Composable can be configured globally via `~/.composable/config.yml`.

### Example Configuration

```yaml
registries:
  - name: default
    url: https://voidrot.github.io/composable/latest
defaults:
  env_file: true
  build: true
  watch: true
```

### Options

- **registries**: A list of fragment registries to use.
- **defaults**: Global defaults for CLI options:
    - `env_file`: Whether to add `env_file: - .env.compose` by default.
    - `build`: Whether to inject `build` configurations by default.
    - `watch`: Whether to inject `develop.watch` configurations by default.

## Release and Versioning


This project uses Release Please with Conventional Commits:

- `fix:` produces a patch release.
- `feat:` produces a minor release.
- `feat!:` (or any `type!:`) produces a major release.

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

## `init-metadata <path>`

**Developer Tool**: Scans a `.yml` file for `${VAR}` syntax and generates a corresponding `.json` metadata file.

## Release and Versioning

This project uses Release Please with Conventional Commits:

- `fix:` produces a patch release.
- `feat:` produces a minor release.
- `feat!:` (or any `type!:`) produces a major release.

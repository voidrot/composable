# CLI Command Reference

## `add <type> <name>`
Adds a fragment to the current project.
- **Type**: The category of the fragment (e.g., `compose`).
- **Name**: The name of the fragment (e.g., `postgresql`).

## `search [query]`
Search for available fragments in the registry.

## `cache --all`
Download all available fragments to the local cache ($HOME/.composable/fragments).

## `update`
Update the local cache with the latest fragments from the registry.

## `init-metadata <path>`
**Developer Tool**: Scans a `.yml` file for `${VAR}` syntax and generates a corresponding `.json` metadata file.

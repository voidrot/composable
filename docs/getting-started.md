# Getting Started with Composable

Composable is a collection of Docker Compose fragments and a CLI tool to manage them.

## Installation

Currently, you can install the CLI locally by cloning the repository and linking the package:

```bash
git clone https://github.com/voidrot/composable.git
cd composable
npm install
npm run build
npm link
```

## Adding your first fragment

To add a PostgreSQL fragment to your project:

```bash
composable add compose postgresql
```

This will:
1. Fetch the `postgresql.yml` fragment.
2. Store it in `./compose/postgresql.yml`.
3. Update your local `.env` file with default environment variables.

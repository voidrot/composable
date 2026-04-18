# Welcome to Composable

Composable is a powerful CLI and registry of Docker Compose fragments designed to streamline your development workflow. 

## Key Features

- **🚀 Instant Service Provisioning**: Add databases, brokers, and AI models to your project with a single command.
- **🧱 Modular Architecture**: Use the `extends` syntax to keep your main `compose.yml` clean and maintainable.
- **📦 Pre-configured Stacks**: Initialize entire application environments (like Django + Postgres + Celery) in seconds.
- **🔄 Smart Build & Watch**: Automatically inject build and watch configurations into your project.
- **🌍 Global Configuration**: Set global defaults for your preferred development environment.

## Quick Start

### Installation

```bash
npm install -g @voidrot/composable
```

### Adding a Service

```bash
composable add compose postgresql
```

### Initializing a Stack

```bash
composable stack init django-base
```

## Documentation Roadmap

- [Commands Reference](commands.md)
- [Fragments Registry](fragments/index.md)
- [Stacks Guide](stacks/index.md)
- [Global Configuration](commands.md#config)


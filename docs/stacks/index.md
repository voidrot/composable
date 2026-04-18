# Stacks

Stacks represent collections of fragments designed to work together as a cohesive architecture. Stacks are defined using JSON configuration files.

## JSON Schema

To ensure your stacks are valid, a JSON schema is available at `schemas/stack.schema.json`. You can reference it in your stack JSON files:

```json
{
  "$schema": "../schemas/stack.schema.json",
  "name": "my-stack",
  "fragments": []
}
```

## Available Stacks

### `django-base`

A production-ready foundation for Django applications. 

- **Components**: 
    - `postgresql` (Database)
    - `valkey` (Cache / Broker)
    - `django` (Web Application)
    - `celery` (Background Worker)
    - `celery-beat` (Scheduler)
    - `celery-flower` (Monitoring)
- **Features**: Automatic dependency linking, shared build context, and hot-reloading for the web and worker services.


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

### [django-base](django-base.md)

A complete Django stack with PostgreSQL, Valkey, Celery, and Flower

- **Components**:
    - [postgresql](../fragments/compose/postgresql.md)
    - [valkey](../fragments/compose/valkey.md)
    - [django](../fragments/compose/django.md)
    - [celery](../fragments/compose/celery.md)
    - [celery-beat](../fragments/compose/celery-beat.md)
    - [celery-flower](../fragments/compose/celery-flower.md)


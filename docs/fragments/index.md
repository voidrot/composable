# Fragments

Fragments are the building blocks of Composable. Each fragment consists of a `.yml` template and a `.json` metadata file. 

## JSON Schema

To ensure fragments are valid, a JSON schema is available at `schemas/fragment.schema.json`. You can reference it in your fragment JSON files to enable IDE validation:

```json
{
  "$schema": "../../schemas/fragment.schema.json",
  "name": "my-fragment"
}
```

The schema defines standard fields such as `name`, `description`, `variables`, and `configs`. It also supports optional `build` and `watch` objects which can be automatically injected into your project's top-level Docker Compose file.

## Available Compose Fragments

- **Databases & Caching**: [postgresql](compose/postgresql.md), [redis](compose/redis.md), [valkey](compose/valkey.md), [chromadb](compose/chromadb.md), [arcadedb](compose/arcadedb.md)
- **Message Brokers**: [rabbitmq](compose/rabbitmq.md), [nats](compose/nats.md), [eclipse-mosquitto](compose/eclipse-mosquitto.md)
- **AI / ML**: [ollama](compose/ollama.md), [vllm](compose/vllm.md)
- **Web & Routing**: [traefik](compose/traefik.md), [caddy](compose/caddy.md)
- **Observability**: [grafana](compose/grafana.md), [influxdb](compose/influxdb.md), [jaeger](compose/jaeger.md), [otel-collector](compose/otel-collector.md)
- **Application Frameworks**:
  - [django](compose/django.md)
  - [celery](compose/celery.md)
  - [celery-beat](compose/celery-beat.md)
  - [celery-flower](compose/celery-flower.md)


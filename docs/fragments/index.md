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

- **Databases & Caching**: `postgresql`, `redis`, `valkey`, `chromadb`, `arcadedb`
- **Message Brokers**: `rabbitmq`, `nats`, `eclipse-mosquitto`
- **AI / ML**: `ollama`, `vllm`
- **Web & Routing**: `traefik`, `caddy`
- **Observability**: `grafana`, `influxdb`, `jaeger`, `otel-collector`
- **Application Frameworks**:
  - `django`
  - `celery`
  - `celery-beat`
  - `celery-flower`

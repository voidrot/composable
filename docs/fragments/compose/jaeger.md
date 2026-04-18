---
title: jaeger
description: Jaeger distributed tracing system (all-in-one)
tags:
  - compose
  - fragment
last_updated: 2026-04-18
---

# jaeger

Jaeger distributed tracing system (all-in-one)

## Variables

The following environment variables can be configured:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `JAEGER_VERSION` | `latest` | | 
| `JAEGER_UI_PORT` | `16686` | | 
| `JAEGER_OTLP_GRPC_PORT` | `4317` | | 
| `JAEGER_OTLP_HTTP_PORT` | `4318` | | 

## Environment File

This fragment defaults to using `.env.compose` for environment variable isolation.

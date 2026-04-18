---
title: otel-collector
description: OpenTelemetry Collector Contrib
tags:
  - compose
  - fragment
last_updated: 2026-04-18
---

# otel-collector

OpenTelemetry Collector Contrib

## Variables

The following environment variables can be configured:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `OTEL_VERSION` | `latest` | | 
| `OTEL_RECEIVER_GRPC_PORT` | `4317` | | 
| `OTEL_RECEIVER_HTTP_PORT` | `4318` | | 
| `OTEL_METRICS_PORT` | `8888` | | 
| `OTEL_HEALTH_PORT` | `13133` | | 

## Environment File

This fragment defaults to using `.env.compose` for environment variable isolation.

---
title: otel-collector
description: OpenTelemetry Collector Contrib
tags:
  - compose
  - fragment
last_updated: 2026-04-28
---

# otel-collector

OpenTelemetry Collector Contrib

## Variables

The following environment variables can be configured:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `OTEL_VERSION` | `0.150.1` | | 
| `OTEL_RECEIVER_GRPC_PORT` | `4317` | | 
| `OTEL_RECEIVER_HTTP_PORT` | `4318` | | 
| `OTEL_METRICS_PORT` | `8888` | | 
| `OTEL_HEALTH_PORT` | `13133` | | 
| `OTEL_FORWARD_OTLP_ENDPOINT` | `signoz-otel-collector:4317` | | 
| `OTEL_FORWARD_OTLP_INSECURE` | `true` | | 
| `OTEL_RECEIVER_JAEGER_GRPC_PORT` | `14250` | | 
| `OTEL_RECEIVER_JAEGER_HTTP_PORT` | `14268` | | 
| `OTEL_RECEIVER_ZIPKIN_PORT` | `9411` | | 

## Environment File

This fragment defaults to using `.env.compose` for environment variable isolation.

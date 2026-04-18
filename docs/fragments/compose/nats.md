---
title: nats
description: NATS message broker with JetStream enabled
tags:
  - compose
  - fragment
last_updated: 2026-04-18
---

# nats

NATS message broker with JetStream enabled

## Variables

The following environment variables can be configured:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `NATS_VERSION` | `latest` | | 
| `NATS_CLIENT_PORT` | `4222` | | 
| `NATS_MONITORING_PORT` | `8222` | | 
| `NATS_CLUSTER_PORT` | `6222` | | 

## Environment File

This fragment defaults to using `.env.compose` for environment variable isolation.

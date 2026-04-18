---
title: traefik
description: Traefik modern reverse proxy and load balancer
tags:
  - compose
  - fragment
last_updated: 2026-04-18
---

# traefik

Traefik modern reverse proxy and load balancer

## Variables

The following environment variables can be configured:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `TRAEFIK_VERSION` | `v3.3` | | 
| `TRAEFIK_HTTP_PORT` | `80` | | 
| `TRAEFIK_HTTPS_PORT` | `443` | | 
| `TRAEFIK_DASHBOARD_PORT` | `8080` | | 

## Environment File

This fragment defaults to using `.env.compose` for environment variable isolation.

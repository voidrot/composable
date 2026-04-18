---
title: caddy
description: Caddy web server with automatic HTTPS
tags:
  - compose
  - fragment
last_updated: 2026-04-18
---

# caddy

Caddy web server with automatic HTTPS

## Variables

The following environment variables can be configured:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `CADDY_VERSION` | `2-alpine` | | 
| `CADDY_HTTP_PORT` | `80` | | 
| `CADDY_HTTPS_PORT` | `443` | | 
| `CADDY_HTTPS_UDP_PORT` | `443` | | 

## Environment File

This fragment defaults to using `.env.compose` for environment variable isolation.

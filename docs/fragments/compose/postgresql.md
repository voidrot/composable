---
title: postgresql
description: PostgreSQL database service
tags:
  - compose
  - fragment
last_updated: 2026-04-18
---

# postgresql

PostgreSQL database service

## Variables

The following environment variables can be configured:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `POSTGRES_VERSION` | `18.3` | | 
| `POSTGRES_USER` | `postgres` | | 
| `POSTGRES_PASSWORD` | `postgres` | | 
| `POSTGRES_DB` | `postgres` | | 
| `PGDATA` | `/var/lib/postgresql/data` | | 
| `POSTGRES_PORT` | `5432` | | 

## Environment File

This fragment defaults to using `.env.compose` for environment variable isolation.

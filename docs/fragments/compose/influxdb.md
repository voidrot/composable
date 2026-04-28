---
title: influxdb
description: InfluxDB time series database
tags:
  - compose
  - fragment
last_updated: 2026-04-28
---

# influxdb

InfluxDB time series database

## Variables

The following environment variables can be configured:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `INFLUXDB_VERSION` | `2` | | 
| `INFLUXDB_PORT` | `8086` | | 
| `INFLUXDB_ADMIN_USER` | `admin` | | 
| `INFLUXDB_ADMIN_PASSWORD` | `admin123` | | 
| `INFLUXDB_ORG` | `my-org` | | 
| `INFLUXDB_BUCKET` | `my-bucket` | | 
| `INFLUXDB_ADMIN_TOKEN` | `my-super-secret-auth-token` | | 

## Environment File

This fragment defaults to using `.env.compose` for environment variable isolation.

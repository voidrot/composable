---
title: influxdb
description: InfluxDB time series database
tags:
  - compose
  - fragment
last_updated: 2026-04-18
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
| `INFLUXDB_ADMIN_PASSWORD` | `adminpassword` | | 
| `INFLUXDB_ORG` | `myorg` | | 
| `INFLUXDB_BUCKET` | `mybucket` | | 
| `INFLUXDB_ADMIN_TOKEN` | `mysupersecrettoken` | | 

## Environment File

This fragment defaults to using `.env.compose` for environment variable isolation.

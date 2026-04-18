---
title: eclipse-mosquitto
description: Eclipse Mosquitto MQTT broker
tags:
  - compose
  - fragment
last_updated: 2026-04-18
---

# eclipse-mosquitto

Eclipse Mosquitto MQTT broker

## Variables

The following environment variables can be configured:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `MOSQUITTO_VERSION` | `latest` | | 
| `MOSQUITTO_MQTT_PORT` | `1883` | | 
| `MOSQUITTO_WS_PORT` | `9001` | | 

## Environment File

This fragment defaults to using `.env.compose` for environment variable isolation.

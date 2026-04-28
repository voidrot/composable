---
title: ollama
description: Get up and running with large language models.
tags:
  - compose
  - fragment
last_updated: 2026-04-28
---

# ollama

Get up and running with large language models.

## Variables

The following environment variables can be configured:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `OLLAMA_VERSION` | `0.21.0` | | 
| `OLLAMA_PORT` | `11434` | | 
| `OLLAMA_KEEP_ALIVE` | `5m` | | 
| `OLLAMA_FLASH_ATTENTION` | `true` | | 
| `OLLAMA_KV_CACHE_TYPE` | `q8_0` | | 
| `OLLAMA_MODELS` | `/root/.ollama/models` | | 
| `OLLAMA_NUM_PARALLEL` | `1` | | 
| `OLLAMA_MAX_VRAM` | `0` | | 
| `GPU_DRIVER` | `nvidia` | | 
| `GPU_COUNT` | `all` | | 

## Environment File

This fragment defaults to using `.env.compose` for environment variable isolation.

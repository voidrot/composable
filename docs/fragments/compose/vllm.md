---
title: vllm
description: High-throughput and memory-efficient LLM inference and serving engine.
tags:
  - compose
  - fragment
last_updated: 2026-04-18
---

# vllm

High-throughput and memory-efficient LLM inference and serving engine.

## Variables

The following environment variables can be configured:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `VLLM_VERSION` | `v0.19.1` | | 
| `VLLM_PORT` | `8000` | | 
| `VLLM_MODEL` | `mistralai/Mistral-7B-v0.1` | | 

## Environment File

This fragment defaults to using `.env.compose` for environment variable isolation.

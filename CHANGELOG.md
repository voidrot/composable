# Changelog

## [0.5.0](https://github.com/voidrot/composable/compare/composable-v0.4.0...composable-v0.5.0) (2026-04-18)


### Features

* add --name option to support custom service naming and variable mapping ([e5be9f1](https://github.com/voidrot/composable/commit/e5be9f1cf1e00a793882a64d1a5322f3131e28e3))
* add GPU configuration support and Ollama/vLLM compose fragments ([1c2d63a](https://github.com/voidrot/composable/commit/1c2d63aa6737ae718d371594f5c40ca70a7da884))

## [0.4.0](https://github.com/voidrot/composable/compare/composable-v0.3.0...composable-v0.4.0) (2026-04-18)


### Features

* merge top-level volumes, networks, and configs from fragments into compose file and ignore /scratch directory ([3062289](https://github.com/voidrot/composable/commit/3062289467c382a1a881812d0d680fb1cb9593e3))

## [0.3.0](https://github.com/voidrot/composable/compare/composable-v0.2.0...composable-v0.3.0) (2026-04-18)


### Features

* add LICENSE file and update package.json with author, license, and keywords ([237c5f5](https://github.com/voidrot/composable/commit/237c5f5ce176cd6190b16f1f6eeed5d554a55a04))

## [0.2.0](https://github.com/voidrot/composable/compare/composable-v0.1.0...composable-v0.2.0) (2026-04-18)


### Features

* add --extend flag to cli add command and install yaml package ([b92c3d4](https://github.com/voidrot/composable/commit/b92c3d467c9d545665220c2528ad6e15c7568dac))
* add initial configuration files, CI workflows, and update documentation for composable ([9948f60](https://github.com/voidrot/composable/commit/9948f6083d4d3ee93332373a40bd65702a248743))
* add Valkey support, upgrade Redis and PostgreSQL, and enhance compose configurations with healthchecks and port mapping ([5c4c35f](https://github.com/voidrot/composable/commit/5c4c35fb65bd72b62dbb13260db80b19983fa4d4))
* change downloaded fragments directory to .compose instead of compose ([7780aef](https://github.com/voidrot/composable/commit/7780aefea9e8b784813f045f39efac027953d0a2))
* implement automatic configuration file management for composable fragments ([e6e8ca5](https://github.com/voidrot/composable/commit/e6e8ca5d6b4277685a793f97f2d5a6ebde535d1b))
* initialize Docker Compose fragment CLI project with remote registry support and automated environment variable management ([c493fc2](https://github.com/voidrot/composable/commit/c493fc208e16a5597778dcc340391beaf8750398))


### Bug Fixes

* correct .gitignore to only ignore top-level registry directory and track build script ([d2da301](https://github.com/voidrot/composable/commit/d2da30143adc2ee0441fbc1db932497d24ac9f70))
* update build:registry script to use ts-node-esm for ES module support ([47d6c71](https://github.com/voidrot/composable/commit/47d6c71c695fed13e5827ee0e1f40a1dc8a0d270))

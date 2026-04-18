# Changelog

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

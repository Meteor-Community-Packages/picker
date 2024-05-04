# Changelog

## v1.2.0 - 2024-05-04
* Deprecating the package as from Meteor 3.0 onwards it is no longer needed. You can use express in Meteor 3 via the WebApp package and do routing like you would with Picker.
* Added instance setup for Meteor 3 in case we move towards compatibility version.
* Updated `path-to-regexp` to v6.2.2

## v1.1.1 - 2022-5-07
* Updated tests to use `fetch`
* Updated `path-to-regexp` to v6.2.1
* Start on moving tests to GitHub

## v1.1.0 - 2020-9-05

### Changes
* Updated `path-to-regexp` npm dependency to v6.1
* Modernized code
* New management under Meteor Community Packages
* Bumped minimum required Meteor version to 1.9 as it is the oldest Meteor version running on Node v12 (currently the oldest Node major version that is still supported).
* Incorporate PRs 34, 39, 42, 52 from the original Picker repository.

# Change Log

All notable changes to the Neo N3 Visual DevTracker extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [2.1.47] - 2021-06-08

### Changed

- C# sample contract now provides scaffolding for a ContractUpdate method
- Fixed an issue where hashes were shown in an unintuitive byte order in some contexts
- Updated Neo Express to latest RC3 build
- Allow asset transfers to arbitrary wallets

## [2.1.45] - 2021-05-18

### Removed

- Removed usage of ms-dotnettools.vscode-dotnet-sdk extension

## [v2.1.43] - 2021-05-17

### Added

- A panel that shows a list of all known smart contracts, allowing quick access to contract metadata
- A panel that shows a list of all known wallets, allowing quick access to balance information

### Changed

- Creating a Java smart contract automatically targets the latest version of neow3j (per Maven Central)
- Make use of the ms-dotnettools.vscode-dotnet-sdk extension to acquire a path to dotnet
  (instead of requiring a global installation accessible in the PATH)
- Updated Neo Express to latest RC2 build
- Updated @cityofzion/neon-core to version 5.0.0-next.10 (latest RC2 build)
- Outdated npm package dependencies have been updated (now using TypeScript 4, Node 14, React 17, webpack 5)

## [v2.0.18] - 2021-03-24

### Added

- Option to start Neo Express using a custom block time
- Application logs are now shown in the transaction details view
- Commands can be invoked via VS Code Command URIs (with arguments)
- Support for checkpoint creation/restoration
- UI support to stop Neo Express

### Changed

- Contract deployment improvements (right click on nef file to deploy a contract; improved messaging when debug info file is missing)
- Various performance improvements

## [v0.5.435-preview] - 2021-01-03

- Initial release

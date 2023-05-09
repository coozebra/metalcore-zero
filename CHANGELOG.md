# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- SBT, ERC4973, ERC4973Enumerable contracts
- SBT claiming tracks already claimed amounts
- Claimer contract
- GamePortal contract deploy script

### Changed
- add mintAsset and mintBatchAsset functions to GP
- add Goerli testnet to hardat config
- update Asset contract deploy script

## [0.2.1] - 2022-07-21
### Changed
- Off-chain signature to sale contract

## [0.2.0] - 2022-07-19
### Added
- Bridging

### Changed
- Asset implement EIP4907 Rental NFT

## [0.1.0] - 2022-07-13
### Added
- initial version
- BaseNFT
- BasePresale
- Operatorable
- BaseSale
- Sale
- Multi-sig
- MetalCore governance token
- In-game currency token
- Blacklist
- ERC20Blacklisted
- GamePortal
- Configuration for Mumbai Polygon testnet
- Distributor

### Changed
- delete pre-sale duration limit and add max mint limit
- add start sale flag and function
- add mint unsold tokens function
- add withdraw Eth function
- testing scripts
- linters for .ts and .sol files
- move duplicated code to BaseSale, and Presale and Sale inherit BaseSale
- the GamePortal contract is generic for all games
- add merging and crafting functions to GP
- update minting and burning functions in base nft and resource nft
- rename BaseNFT to Asset, ResourceNFT to Resource
- add Distributor contract for sale
- change Distributor `withdrawBatch` interface to support address list
- sale contract for Asset NFT 
- Asset and Resource contracts support EIP2981 Royalty Standard

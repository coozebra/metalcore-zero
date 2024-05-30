# Zero

Implementation of the ERC20 and ERC721/1155 tokens and game portal for Infinite
Games.

## Prerequisites


## FAB

This contract extends an ERC20 token with

- ERC20Burnable
- ERC20Blacklisted
- ApprovalCaller

## MGT

This contract extends an ERC20 token with

- ERC20Votes
- ERC20Burnable
- ERC20Blacklisted
- ApprovalCaller

## BaseNFT

This contract extends an ERC721 token with

- ERC721Enumerable
- ERC721Burnable
- ERC721Blacklisted
- Pausable

Test the basic feature of the BaseNFT by modifying the function calls on the
script `script/basenft-utils.ts`. Then you can test it on Polygon Mumbai with:

```
npx hardhat run scripts/basenft-utils.ts --network polygon_mumb
```

# Deployments

**Mumbai**

 * Asset: (0x887093851d866B4a7699E3f304FA0D686F85f720)[https://mumbai.polygonscan.com/address/0x887093851d866B4a7699E3f304FA0D686F85f720#code]

 * Distributor: (0x08Dd245071235b597f13F5C0a1C07D044a4eA3E9)[https://mumbai.polygonscan.com/address/0x08Dd245071235b597f13F5C0a1C07D044a4eA3E9#code]

 **Ropsten**

* Asset: (0x1FCdE17449166B4BD089a833c3a2eAe7117f4dC5)[https://ropsten.etherscan.io/address/0x1FCdE17449166B4BD089a833c3a2eAe7117f4dC5#code]

* Distributor: (0xd5F2Ec8f6DA90A1400329D259455877501De8caF)[https://ropsten.etherscan.io/address/0xd5F2Ec8f6DA90A1400329D259455877501De8caF#code]

* Arsenal Pass (`Asset` type with 1000 minted tokens assign to 1000 random addresses):
  (0xDad460395e6e98F2B86D23bBdfb7c58b3740d5a1)[https://ropsten.etherscan.io/address/0xDad460395e6e98F2B86D23bBdfb7c58b3740d5a1#code]

# Basic Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
```

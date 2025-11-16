# Sample Hardhat 3 Beta Project (`node:test` and `viem`)

This project showcases a Hardhat 3 Beta project using the native Node.js test runner (`node:test`) and the `viem` library for Ethereum interactions.

To learn more about the Hardhat 3 Beta, please visit the [Getting Started guide](https://hardhat.org/docs/getting-started#getting-started-with-hardhat-3). To share your feedback, join our [Hardhat 3 Beta](https://hardhat.org/hardhat3-beta-telegram-group) Telegram group or [open an issue](https://github.com/NomicFoundation/hardhat/issues/new) in our GitHub issue tracker.

## Project Overview

This example project includes:

- A simple Hardhat configuration file.
- Foundry-compatible Solidity unit tests.
- TypeScript integration tests using [`node:test`](nodejs.org/api/test.html), the new Node.js native test runner, and [`viem`](https://viem.sh/).
- Examples demonstrating how to connect to different types of networks, including locally simulating OP mainnet.

## Usage

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```

You can also selectively run the Solidity or `node:test` tests:

```shell
npx hardhat test solidity
npx hardhat test nodejs
```

### Deploy EventTicket Contract

This project includes an Ignition module at `ignition/modules/EventTicket.ts`. You can deploy the contract to a persistent local node or to Sepolia.

#### Deploy to a persistent local Hardhat node

1. **Terminal A** – start the node:
   ```shell
   npx hardhat node
   ```
   Leave this terminal running; it hosts the local blockchain.
2. **Terminal B** – deploy to that node:
   ```shell
   npx hardhat ignition deploy --network localhost ignition/modules/EventTicket.ts
   ```
   Ignition will log the deployed contract address (for example `0x5FbD...0aa3`). Keep the node process running so the deployment persists.

> Quick one-off test: `npx hardhat ignition deploy ignition/modules/EventTicket.ts` spins up an ephemeral in-process chain. The deployment disappears once the command finishes, so use it only for throwaway tests.

#### Deploy to Sepolia

To deploy to Sepolia, you need funded test ETH and these config variables:

- `SEPOLIA_PRIVATE_KEY` – the 64-hex-character private key of the account you will deploy from (MetaMask → Account Details → Export Private Key).
- `SEPOLIA_RPC_URL` – your Sepolia RPC endpoint (Alchemy, Infura, QuickNode, etc.).

Set them with `hardhat-keystore`:

```shell
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
npx hardhat keystore set SEPOLIA_RPC_URL
```

Or export them as environment variables:

```shell
export SEPOLIA_PRIVATE_KEY=0xyourprivatekey
export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
```

Then deploy:

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/EventTicket.ts
```

Save the contract address Ignition prints; you’ll use it in scripts and the frontend.

## NFT Ticketing Dashboard

This package hosts the React dashboard for the `EventTicket` smart contract.  
It is built with Next.js (App Router), Tailwind, Wagmi, Viem, and React Query.

### 1. Prerequisites

- Run a local Hardhat node (`npx hardhat node` inside `hardhat/`).
- Deploy the `EventTicket` contract (Ignition deployment already places it at `0x5FbD...aa3` on chain `31337`).

### 2. Configure environment variables

```bash
cd frontend
cp .env.local.example .env.local
# adjust RPC URL or contract address if they change
```

Variables:

- `NEXT_PUBLIC_RPC_URL` – HTTP RPC endpoint for your local EVM (defaults to Hardhat at `http://127.0.0.1:8545`).
- `NEXT_PUBLIC_EVENT_TICKET_ADDRESS` – deployed `EventTicket` address.

### 3. Install dependencies

```bash
npm install
```

### 4. Start the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to use the dashboard.

### Features

- Connect MetaMask/injected wallets to the local Hardhat chain.
- Create events by writing directly to the `EventTicket` contract.
- Mint tickets (payable) and view live supply stats.
- Inspect tickets owned by the connected wallet.

### Contract ABIs

The ABI from Hardhat compilation lives at `src/contracts/EventTicket.json`.

- Hardhat writes this artifact after `npx hardhat compile`, and it contains the ABI + bytecode for `EventTicket`.
- Wagmi/Viem read that ABI so the React app knows how to encode function calls (e.g., `createEvent`, `mintTicket`) and decode returned structs.
- Whenever the Solidity contract changes, copy the new artifact into the frontend:

```bash
cp ../hardhat/artifacts/contracts/EventTicket.sol/EventTicket.json src/contracts/EventTicket.json
```

If the ABI is missing or outdated, the dashboard can’t call the contract or may misinterpret responses.

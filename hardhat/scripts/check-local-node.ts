import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
  parseEther,
} from "viem";
import { hardhat } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

import eventTicketArtifact from "../artifacts/contracts/EventTicket.sol/EventTicket.json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_LOCAL_RPC_URL = "http://127.0.0.1:8545";
const DEFAULT_LOCAL_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

type EventTicketArtifact = {
  abi: typeof eventTicketArtifact.abi;
};

const deploymentAddressesPath = path.join(
  __dirname,
  "..",
  "ignition",
  "deployments",
  "chain-31337",
  "deployed_addresses.json"
);

function loadContractAddress(): `0x${string}` {
  try {
    const addresses = JSON.parse(
      readFileSync(deploymentAddressesPath, "utf-8")
    ) as Record<string, string>;
    const address =
      addresses["EventTicketModule#EventTicket"] ??
      addresses["eventTicket"] ??
      "";
    if (!address) {
      throw new Error(
        "EventTicket address not found in deployed_addresses.json"
      );
    }
    return address as `0x${string}`;
  } catch (error) {
    throw new Error(
      `Unable to read deployment file at ${deploymentAddressesPath}: ${String(
        error
      )}`
    );
  }
}

async function main() {
  const rpcUrl = process.env.LOCAL_RPC_URL ?? DEFAULT_LOCAL_RPC_URL;
  const privateKey =
    process.env.LOCAL_DEPLOYER_KEY ?? DEFAULT_LOCAL_PRIVATE_KEY;

  const contractAddress = loadContractAddress();
  console.log("Using RPC URL:", rpcUrl);
  console.log("Using contract address:", contractAddress);

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  console.log("Acting as account:", account.address);

  const publicClient = createPublicClient({
    chain: hardhat,
    transport: http(rpcUrl),
  });
  const walletClient = createWalletClient({
    chain: hardhat,
    transport: http(rpcUrl),
    account,
  });

  const contractAbi = (eventTicketArtifact as EventTicketArtifact).abi;

  const contractName = (await publicClient.readContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: "name",
  })) as string;
  console.log("Connected to contract:", contractName);

  const eventDate = BigInt(Math.floor(Date.now() / 1000) + 86_400); // +1 day
  const ticketPrice = parseEther("0.05");

  console.log("Creating a test event via viem...");
  const createEventHash = await walletClient.writeContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: "createEvent",
    args: [
      "Local Dev Day",
      "Event created from check-local-node.ts",
      eventDate,
      "Localhost Arena",
      5n,
      ticketPrice,
    ],
  });
  await publicClient.waitForTransactionReceipt({ hash: createEventHash });
  console.log("Event created. tx hash:", createEventHash);

  const totalEvents = (await publicClient.readContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: "totalEvents",
  })) as bigint;
  console.log("Total events on-chain:", totalEvents.toString());

  console.log("Minting a ticket for event #1...");
  const mintTicketHash = await walletClient.writeContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: "mintTicket",
    args: [1n, account.address],
    value: ticketPrice,
  });
  await publicClient.waitForTransactionReceipt({ hash: mintTicketHash });
  console.log(
    "Ticket minted. tx hash:",
    mintTicketHash,
    "value:",
    formatEther(ticketPrice),
    "ETH"
  );

  const ownedTickets = (await publicClient.readContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: "getOwnerTickets",
    args: [account.address],
  })) as readonly bigint[];
  console.log("Tickets owned by", account.address, "=>", ownedTickets);

  console.log(
    "✅ Successfully interacted with the local Hardhat node via viem."
  );
}

main().catch((error) => {
  console.error("Error while checking local node:", error);
  process.exitCode = 1;
});

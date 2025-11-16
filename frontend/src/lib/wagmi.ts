import { http, createConfig, fallback } from "wagmi";
import { injected, metaMask } from "wagmi/connectors";
import { defineChain } from "viem";

const rpcUrl =
  process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545";

export const hardhatChain = defineChain({
  id: 31337,
  name: "Local Hardhat",
  network: "hardhat",
  nativeCurrency: {
    name: "Hardhat ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [rpcUrl],
    },
    public: {
      http: [rpcUrl],
    },
  },
});

export const wagmiConfig = createConfig({
  chains: [hardhatChain],
  transports: {
    [hardhatChain.id]: fallback([http(rpcUrl)]),
  },
  connectors: [
    metaMask({ chains: [hardhatChain] }),
    injected({ chains: [hardhatChain], shimDisconnect: true }),
  ],
  ssr: true,
});


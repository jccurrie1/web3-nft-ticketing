# Web3 NFT Ticketing Demo

## Why Tho

This project explores Web3 technology by building a simple decentralized application to understand how crypto infrastructure works in practice. The goal is to gain hands-on experience and evaluate where blockchain development adds real value — beyond hype or speculation.

The intent is to:

- Learn blockchain fundamentals through practical development.
- Experiment with how decentralized ownership and transactions function.
- Create a project that demonstrates applied understanding of Web3 concepts.
- Build something that addresses a real-world pain point and is worth showcasing to other developers and potential employers.

---

## 💡 Project Idea

**Web3 NFT Ticketing Demo**

A minimal decentralized application that lets users:

- Mint event tickets as NFTs.
- Transfer or resell tickets securely on-chain.
- Verify ticket authenticity without relying on a centralized company.

This prototype represents an emerging use case for Web3 that could eventually address many long-standing issues in the ticketing industry.

---

## 🌟 Goals

1. Understand how wallet connections, smart contracts, and NFTs interact.
2. Deploy a minimal ERC-721 contract for minting and transferring event tickets.
3. Create a simple frontend for viewing, buying, and reselling NFT tickets.
4. Evaluate which aspects of Web3 development are practical and which are still immature.

---

## 🚨 Problems with Existing Ticket Solutions

| Problem                         | Description                                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **1. High & Hidden Fees**       | Ticket platforms like SeatGeek or Ticketmaster add service, delivery, and facility fees that aren’t transparent. |
| **2. Fake or Invalid Tickets**  | Buyers must trust the platform or the seller — fraud and duplicates are common.                                  |
| **3. Hard to Resell Safely**    | Secondary sales require trust; buyers risk scams or invalid QR codes.                                            |
| **4. Scalping Bots**            | Automated bots buy tickets instantly, driving up prices.                                                         |
| **5. No True Ownership**        | Users don’t actually own their tickets — they’re licenses controlled by the platform.                            |
| **6. Lost Revenue for Artists** | When tickets are resold, creators get none of the profit.                                                        |
| **7. Surge Pricing**            | Algorithms raise prices dynamically, frustrating fans.                                                           |
| **8. Costly Refunds/Disputes**  | Centralized platforms handle disputes manually and expensively.                                                  |

---

## 🧩 How Web3 Could Help

| Solution                     | What Web3 Enables                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------- |
| **NFT Tickets**              | Each ticket is unique, verifiable, and can’t be duplicated.                       |
| **Transparent Resale Rules** | Smart contracts can cap resale prices or enforce royalties.                       |
| **True Ownership**           | Users hold tickets directly in their wallets rather than through an intermediary. |
| **No Middlemen**             | Transfers happen peer-to-peer, validated on-chain.                                |
| **Creator Royalties**        | Artists or venues can automatically earn from secondary sales.                    |

---

## ⚙️ Planned Tech Stack

- **Solidity** – Smart contract logic for NFT minting and resale rules
- **Hardhat** – Local Ethereum dev environment
- **React + ethers.js** – Frontend interface for wallet interaction
- **Polygon (Testnet)** – Cheap, fast deployment network
- **Pinata or Web3.Storage** – Optional IPFS for storing ticket metadata

---

## 🦯 Roadmap

1. **Phase 1:** Smart contract for minting & transferring NFT tickets
2. **Phase 2:** Frontend for wallet connection and ticket management
3. **Phase 3:** Add resale logic with royalty splits
4. **Phase 4:** Optional: Integrate IPFS for event images & metadata
5. **Phase 5:** Documentation and short demo video

---

## 🧠 Takeaway

This project is designed to demonstrate technical curiosity and applied understanding of blockchain concepts. It serves as a practical exercise in decentralized app development and as a portfolio piece for discussing the strengths and limitations of Web3 systems with other engineers.

---

## 🪙 License

MIT — because learning should be open.

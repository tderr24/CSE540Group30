# PharmaTrace
### Blockchain-Based Pharmaceutical Supply Chain System
**Course:** CSE540 – Enterprise Blockchain Applications  
**Team:** Group 30 – PharmaTrace

---

## 1. Project Overview

PharmaTrace is a production-ready prototype that tracks pharmaceutical batches from creation through delivery using Ethereum smart contracts, IPFS metadata, and a MetaMask-enabled React frontend. Every stakeholder—Producer, Supplier, Retailer, Consumer, Regulator, and Admin—receives a tailored dashboard that mirrors their real-world responsibilities (registering products, transferring custody, auditing history, etc.).

Goals:

- **Patient safety** – stop counterfeit drugs from entering the supply chain.
- **Cold-chain assurance** – anchor temperature or certificate artifacts via IPFS.
- **End-to-end transparency** – give regulators and consumers a verifiable audit trail.
- **Automation** – use smart contracts to enforce role permissions and immutable history.

---

## 2. Repository Structure

```
.
├── contracts/               # Solidity sources (AccessControl, Provenance)
├── scripts/                 # Hardhat deployment/verification helpers
├── test/                    # Hardhat tests
├── frontend/                # React UI (see frontend/README.md for details)
├── deliverables.md          # 10-page written summary (architecture, results, etc.)
├── hardhat.config.js        # Hardhat configuration
├── package.json             # Root-level scripts (deploy, verify, lint)
└── README.md                # This document
```

Key scripts (`package.json`):

| Script | Purpose |
| --- | --- |
| `npm run node` | Launch Hardhat local blockchain (31337) |
| `npm run deploy:local` | Deploy contracts locally + seed demo roles/products + write `frontend/src/contracts/deployment.json` |
| `npm run deploy:sepolia` | Deploy AccessControl + Provenance to Sepolia using `.env` credentials |
| `npm run verify:sepolia` | Etherscan verification helper |
| `npm run frontend` | Convenience wrapper (`cd frontend && npm start`) |

---

## 3. System Architecture

### On-Chain (Layer 1)

- `AccessControl.sol` – Extends OpenZeppelin AccessControl, defines PRODUCER/SUPPLIER/RETAILER/CONSUMER/REGULATOR + DEFAULT_ADMIN roles, plus helper grant/revoke functions.
- `Provenance.sol` – Product lifecycle contract. Core functions:
  - `registerProduct(bytes32 id, string name, string metadataHash)`
  - `transferProduct(bytes32 id, address newOwner, ProductStatus newStatus)`
  - `updateProductStatus(bytes32 id, ProductStatus status)`
  - `getProductDetails`, `getProductHistory`, `regulatorCheckProduct`
- Events (`ProductRegistered`, `OwnershipTransferred`, `StatusUpdated`) give the UI a reliable event log for reconstruction.

### Off-Chain (Layer 2)

- IPFS (or any content-addressed store) holds certificates, temperature logs, etc. Only the hash is stored on-chain.

### Frontend (Layer 3)

- React (Create React App) + ethers.js.
- Reads ABI + deployment info from `frontend/src/contracts/`.
- `useAccountProducts` hook fetches every registered product and filters by current wallet.
- Dashboards per role handle registrations, transfers, and audits with contextual UI.

---

## 4. Prerequisites

| Dependency | Version | Notes |
| --- | --- | --- |
| Node.js | ≥ 18.x | Required for Hardhat + CRA |
| npm | ≥ 9.x | Yarn/pnpm work but npm scripts are provided |
| MetaMask | Latest | Install browser extension |
| Hardhat | Bundled locally | No global install required |
| RPC provider | Alchemy / Infura | Needed for Sepolia deployments |

---

## 5. Local Development (Hardhat Network)

```bash
git clone https://github.com/tderr24/CSE540Group30.git
cd CSE540Group30

# install root dependencies (Hardhat + scripts)
npm install

# start local blockchain (Terminal 1)
npm run node

# deploy contracts + seed demo data + write frontend deployment.json (Terminal 2)
npm run deploy:local

# launch frontend (Terminal 3)
cd frontend
npm install   # first run only
npm start
```

The deploy script funds six demo accounts (Producer→Admin) and registers sample batches so every dashboard has data immediately. Import the printed private keys into MetaMask (see `frontend/TESTING_GUIDE.md` for the table).

---

## 6. Testnet Deployment (Sepolia)

1. Create `.env` in repo root:

```env
SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/<key>"
PRIVATE_KEY="0xyourwallet"
ADMIN_ADDRESS="0xadminWallet"        # optional: auto-transfer DEFAULT_ADMIN_ROLE
REVOKE_DEPLOYER_ADMIN="true"          # optional: remove deployer after handoff
```

2. Deploy + verify:

```bash
npm run deploy:sepolia
npm run verify:sepolia
```

3. Copy the generated `frontend/src/contracts/deployment.json` into your front-end build artifact (or redeploy the frontend). The React app will automatically prompt MetaMask to switch to chain 11155111 and then connect.

---

## 7. Frontend Usage Highlights

- **WalletConnect header** – connect/disconnect, display role badge, switch accounts without leaving the page.
- **Producer dashboard** – register product form (auto generates batch IDs using keccak256). After submission, success toast displays the ID for future transfers.
- **Supplier/Retailer dashboards** – list owned batches via `useAccountProducts`, allow status transitions (e.g., Shipped → InTransit → Received → InStock → Sold).
- **Consumer dashboard** – view purchased products and verify authenticity with the Product Verification portal.
- **Regulator dashboard** –
  - Non-admin regulators: see owned products plus full audit history.
  - Admin regulators: unlock role management UI + global product explorer.
- **Product Verification portal** – any role (or even disconnected user) can paste a Product ID to view metadata/history.

For detailed user flows, see `frontend/TESTING_GUIDE.md`.

---

## 8. Testing & Validation

- **Smart contracts** – add Hardhat tests under `test/`. Run with:

```bash
npx hardhat test
```

- **Frontend** – Create React App defaults:

```bash
cd frontend
npm test
npm run build    # ensures production bundle compiles
```

- **Manual QA** – Use the scripted accounts (Producer, Supplier, Retailer, Consumer, Regulator, Admin) to walk a product through the entire lifecycle. All steps are documented in `frontend/TESTING_GUIDE.md`.

---

## 9. Troubleshooting

| Issue | Fix |
| --- | --- |
| MetaMask opens in full tab | Browser behavior; pin the extension or toggle "Expand view" off. Not controllable by dApp. |
| "Contract not deployed" toast | Run `npm run deploy:local` (or copy fresh `deployment.json` after Sepolia deploy). |
| Wrong network error | Click the in-app button to trigger `wallet_switchEthereumChain`. Ensure `chainId` in `deployment.json` matches the network you're on. |
| Regulator dashboard empty | Only admins see the global explorer. Non-admin regulators must own at least one product (transfer from Producer/Supplier) to populate the list. |
| Etherscan verify fails | Wait for contract bytecode to propagate, confirm Hardhat compiler version matches `hardhat.config.js`, rerun `npm run verify:sepolia`. |

---

## 10. Deliverables & Documentation

- `deliverables.md` – 10-page paper-style writeup: abstract, literature review, architecture, results, future work, team contributions, references.
- `frontend/README.md` – deep dive into the React app (architecture diagram, setup, troubleshooting).
- `frontend/TESTING_GUIDE.md` – step-by-step walkthrough for every stakeholder role on both localhost and Sepolia.

---

## 11. License / Academic Use

This repository is part of the ASU CSE540 Group 30 coursework. It is intended for educational use; do not deploy to production without additional security audits and compliance reviews.

---

Questions or feedback? Open an issue or reach out to the team.  
PharmaTrace © 2025 – Group 30
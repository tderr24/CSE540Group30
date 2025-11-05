# 💊 PharmaTrace  
### Blockchain-Based Pharmaceutical Supply Chain Provenance System  
**Course:** CSE540: Enterprise Blockchain Applications  
**Team:** Group 30 — *PharmaTrace*  
**Date:** October 23, 2025  

---

## 🧩 Project Description

**PharmaTrace** is a blockchain-based supply chain provenance system designed to combat **counterfeit drugs** and ensure **product integrity** in the pharmaceutical industry.  
By leveraging **Ethereum smart contracts**, **IPFS for off-chain storage**, and a **React.js front-end**, PharmaTrace provides a **transparent, auditable, and decentralized** record of a drug’s journey — from **manufacturer to pharmacy**.

### 🎯 Objectives
- **Enhance Patient Safety:** Prevent counterfeit or unauthorized drugs from entering the supply chain.  
- **Ensure Product Integrity:** Enable verifiable tracking of temperature-sensitive shipments (e.g., vaccines).  
- **Increase Transparency:** Provide stakeholders with appropriate visibility into product provenance.  
- **Build Trust:** Create an immutable, auditable record accessible to regulators and consumers alike.

---

## 🏗️ System Architecture

PharmaTrace uses a **hybrid on-chain/off-chain architecture** for scalability and cost efficiency.

### **Layer 1 – On-Chain (Ethereum / Solidity)**
- **Contracts:**  
  - `AccessControl.sol`: Role-Based Access Control (RBAC) managing roles — Producer, Supplier, Retailer, Regulator.  
  - `Provenance.sol`: Core lifecycle contract for registering, transferring, and updating product status.
- **Key Functions:**  
  - `registerProduct()`  
  - `transferOwnership()`  
  - `updateStatus()`  
- **Events:**  
  - `ProductRegistered`  
  - `OwnershipTransferred`

### **Layer 2 – Off-Chain (IPFS)**
- Stores product metadata (certifications, temperature logs, batch data).  
- IPFS content identifiers (CIDs) are hashed and stored on-chain for reference.

### **Layer 3 – Front-End (React.js + Ethers.js)**
- Web interface with:
  - Stakeholder dashboards (Producer, Supplier, Retailer, Regulator)
  - Public verification portal (search by Product ID)
- Wallet connection via **MetaMask**.

---

## ⚙️ Dependencies & Setup Instructions

### **Backend (Smart Contracts)**
- **Language:** Solidity  
- **Framework:** Hardhat  
- **Blockchain:** Ethereum (Sepolia Testnet)

#### Prerequisites:
- Node.js (>= 18)
- npm or yarn
- MetaMask wallet
- Access to [Infura](https://infura.io/) or [Alchemy](https://www.alchemy.com/) for RPC connection

## 🚀 Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/tderr24/CSE540Group30.git
cd CSE540Group30
```

---

### 2. Install Dependencies

Install all required Node.js dependencies:

```bash
npm install
```

---

### 3. Install Hardhat

If Hardhat is not installed globally, install it as a development dependency:

```bash
npm install --save-dev hardhat
```

---

### 4. Install OpenZeppelin Contracts

This repository uses **OpenZeppelin Contracts** for secure, standard implementations of roles and access control:

```bash
npm install @openzeppelin/contracts
```

---

## 🧩 How to Use or Deploy (In Progress)

> These instructions are a draft and will be refined as the project progresses.

---

### 🔧 Compiling the Contracts

To compile the smart contracts:

```bash
npx hardhat compile
```

---

### 🧪 Running Tests

> Unit tests are currently under development.

Run the test suite (once available):

```bash
npx hardhat test
```

---

### 🚀 Deploying the Contract

1. Create a `.env` file in the root directory.  
2. Add your **private key** and **network RPC URL** (from [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/)):

   ```env
   SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/your-api-key"
   PRIVATE_KEY="0xYourPrivateKey"
   ```

3. Run the deployment script on the **Sepolia Testnet**:

   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

---

## 💻 Running the Front-End (Future Implementation)

> The React front-end is not yet implemented.

When available, the expected commands will be:

```bash
# cd frontend
# npm start
```

---

## 📄 License

This project is part of the **CSE540 Group 30** coursework and is intended for educational use.

---

### 🧠 Notes
- Ensure you have **Node.js** and **npm** installed.
- You’ll need testnet ETH (from a Sepolia faucet) to deploy to Sepolia.
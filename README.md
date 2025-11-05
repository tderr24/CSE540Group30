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

#### Installation:
```bash
# Clone repository
git clone https://github.com/<your-org>/pharmatrace.git
cd pharmatrace

# Install dependencies
npm install

# Testing Your PharmaTrace Application

## Quick Start (3 Steps)

### 1. Start Hardhat Local Network
**Terminal 1:**
```bash
npm run node
```
Keep this running! You'll see 20 test accounts with private keys.

### 2. Deploy Contracts
**Terminal 2:**
```bash
npm run deploy:local
```
This will:
- Deploy AccessControl and Provenance contracts
- Grant roles to 6 test accounts
- Create 2 sample products
- Save contract addresses to `frontend/src/contracts/deployment.json`

### 3. Start React App
**Terminal 3:**
```bash
cd frontend && npm start
```
Opens browser at `http://localhost:3000`

---

## MetaMask Setup

### Add Localhost Network
1. Open MetaMask → Networks → Add Network Manually
2. Enter:
   - **Network Name:** Hardhat Local
   - **RPC URL:** `http://localhost:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** ETH

### Import Test Accounts

Copy private keys from Terminal 1 (after `npm run node`):

| Role | Account | Private Key |
|------|---------|-------------|
| Producer | Account #1 | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| Supplier | Account #2 | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| Retailer | Account #3 | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| Consumer | Account #4 | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| Regulator | Account #5 | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |
| Admin | Account #0 | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |

**To Import:**
1. MetaMask → Account Icon → Import Account
2. Paste private key
3. Label the account (e.g., "Producer", "Supplier")
4. Repeat for each role

> 💡 **Quickly switch roles from the dApp:** After connecting, use the new **Switch Account** button next to Disconnect in the header. This re-opens MetaMask's account picker so you can hop between Producer/Supplier/etc. wallets without digging through the extension menu.

---

## Testing Scenarios

### Scenario 1: Complete Product Journey

**Step 1: Register Product (Producer)**
1. Switch to **Producer** account in MetaMask
2. Connect wallet in the app
3. You'll see the Producer Dashboard
4. Fill in:
   - Product Name: `COVID-19 Vaccine Batch 2025-001`
   - IPFS Hash: `QmTest123abc` (any text for testing)
5. Click "Register Product"
6. Approve MetaMask transaction
7. Copy the batch number from success message

**Step 2: Verify Product**
1. Scroll to "Product Verification Portal"
2. Click "Use Test ID" (uses pre-generated ID)
3. Click "Search"
4. See product details and history showing "Created" status

**Step 3: Transfer to Supplier**
1. Keep verification portal open with product details
2. Copy the Product ID (the 0x... hash)
3. Switch to **Supplier** account in MetaMask
4. Refresh page and reconnect wallet
5. Open browser console (F12)
6. Run this to transfer:
```javascript
const productId = "0x..."; // Your product ID
const supplierAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Account #2
await window.ethereum.request({
  method: 'eth_sendTransaction',
  params: [{
    from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Producer
    to: "YOUR_PROVENANCE_CONTRACT_ADDRESS", // From deployment.json
    data: contract.interface.encodeFunctionData('transferProduct', [productId, supplierAddress, 2]) // Status: Shipped
  }]
});
```

**Step 4: Supplier Updates Status**
1. As Supplier, search for product in verification portal
2. See "Shipped" status and updated history
3. Update to "InTransit" using similar console command

**Step 5: Continue the Chain**
- Transfer to Retailer → Status: Received
- Retailer updates → Status: InStock
- Transfer to Consumer → Status: Sold
- Regulator can view entire history at any time

### Scenario 2: Regulator Audit

1. Switch to **Regulator** account
2. Connect wallet
3. Use Product Verification to search any product
4. View complete history from creation to current status
5. See all actors who handled the product

### Scenario 3: Consumer Verification

1. Switch to **Consumer** account
2. After purchasing a product (via transfer from Retailer)
3. Search product ID in verification portal
4. Verify authenticity by checking:
   - Complete history from producer to you
   - All intermediate handlers (supplier, retailer)
   - Timestamps of each transfer

### Scenario 4: Assign Roles from the Admin Dashboard

1. Connect with the wallet that holds the **DEFAULT_ADMIN_ROLE** (typically the deployer or the address set via `ADMIN_ADDRESS`).
2. After connecting, the Regulator Dashboard upgrades to an **Admin Dashboard** with a "⚙️ Admin Role Management" card.
3. To grant a role:
  - Pick the stakeholder role (Producer, Supplier, Retailer, Consumer, Regulator).
  - Paste the recipient wallet address.
  - Click **Grant Role** and approve the MetaMask transaction.
4. To revoke a role:
  - Select the role and enter the wallet address to remove.
  - Click **Revoke Role** and confirm the transaction.
5. The UI shows success/error banners plus the on-chain role identifiers so you can verify permissions at a glance.

---

## Common Issues

### "Please connect your wallet first"
- Make sure MetaMask is connected to Hardhat Local (Chain ID 31337)
- Click "Connect Wallet" button in the app

### "Transaction reverted"
- Check you're using the correct account for the action
- Producer can only register, not transfer others' products
- Only current owner can transfer a product

### "Product not found"
- Make sure you deployed with `npm run deploy:local`
- Use the "Use Test ID" button or copy ID from registration success message

### MetaMask shows wrong network
- Click "Switch to Localhost" button in the app
- Or manually switch in MetaMask to "Hardhat Local"

---

## Sample Product IDs

After running `npm run deploy:local`, these products exist:

```javascript
// Product 1
ID: keccak256("BATCH-2025-001")
= 0x8a4c9c443bb0645df646a2d5bb55def0ed1d19645f7c926c3c2e7c9f7c4c1c5a

// Product 2  
ID: keccak256("BATCH-2025-002")
= 0x9b5d9d554cc0756ef757b3e6cc66eef0fe2e20756f8d037d3d3f8d0f8d5d2d6b
```

Use these IDs in the verification portal to test!

---

## Advanced: Manual Testing via Console

Open browser console (F12) and use these commands:

```javascript
// Get contract instance
const contract = await window.contract; // Available after wallet connection

// Register product
const tx = await contract.registerProduct(
  ethers.keccak256(ethers.toUtf8Bytes('BATCH-123')),
  'Test Vaccine',
  'QmTestHash'
);
await tx.wait();

// Get product details
const product = await contract.getProductDetails(productId);
console.log(product);

// Get product history
const history = await contract.getProductHistory(productId);
console.log(history);

// Transfer product
await contract.transferProduct(productId, newOwnerAddress, 2); // 2 = Shipped

// Update status
await contract.updateProductStatus(productId, 3); // 3 = InTransit
```

---

## Status Codes Reference

| Code | Name | Color | When to Use |
|------|------|-------|-------------|
| 0 | Created | 🔵 Blue | Product just registered |
| 1 | Shipped | 🟡 Yellow | Producer ships to supplier |
| 2 | InTransit | 🟠 Orange | During transportation |
| 3 | Received | 🟢 Green | Delivered to destination |
| 4 | InStock | 🟣 Purple | Retailer has in inventory |
| 5 | Sold | ✅ Green | Consumer purchased |
| 6 | Flagged | 🔴 Red | Issue detected by regulator |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                 React Frontend                       │
│  (localhost:3000)                                   │
│  ├── Wallet Connection (MetaMask)                   │
│  ├── Role Detection (Producer/Supplier/etc)         │
│  └── Dashboard Routing                              │
└────────────────┬────────────────────────────────────┘
                 │
                 │ ethers.js
                 ▼
┌─────────────────────────────────────────────────────┐
│           Hardhat Local Network                      │
│  (localhost:8545, Chain ID: 31337)                  │
│  ├── AccessControl Contract                         │
│  │   └── Role Management (5 roles)                  │
│  └── Provenance Contract                            │
│      ├── registerProduct()                          │
│      ├── transferProduct()                          │
│      ├── updateProductStatus()                      │
│      ├── getProductDetails()                        │
│      ├── getProductHistory()                        │
│      └── regulatorCheckProduct()                    │
└─────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Test the basic flow** (register → transfer → verify)
2. **Try different roles** (switch accounts in MetaMask)
3. **Explore the UI** (each role sees different dashboards)
4. **Check the history** (see complete audit trail)
5. **Experiment with errors** (try invalid transfers, wrong roles)

Happy testing! 🚀

# Testing PharmaTrace with React Frontend Locally

This guide shows you how to test the PharmaTrace smart contracts with a React UI without deploying to a testnet.

## Prerequisites

- Node.js (v18+)
- MetaMask browser extension
- Basic React knowledge

## Architecture

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│  React Frontend │ ◄───► │    MetaMask      │ ◄───► │ Hardhat Network │
│   (localhost:   │       │  (Web3 Provider) │       │  (localhost:    │
│     3000)       │       │                  │       │     8545)       │
└─────────────────┘       └──────────────────┘       └─────────────────┘
```

## Step 1: Start Local Blockchain

Open **Terminal 1** and run:

```bash
npm run node
```

This starts a local Hardhat blockchain at `http://localhost:8545` with:
- 20 pre-funded accounts (10,000 ETH each)
- Instant transaction mining
- Console logging of all transactions

**Leave this terminal running!**

You'll see output like:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========

WARNING: These accounts, and their private keys, are publicly known.
Any funds sent to them on Mainnet or any other live network WILL BE LOST.

Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

...
```

## Step 2: Deploy Contracts to Local Network

Open **Terminal 2** and run:

```bash
npm run deploy:local
```

This will:
- Deploy the Provenance contract
- Grant roles to test accounts
- Create sample products
- Save contract addresses and ABIs to `frontend/src/contracts/`

**Keep both terminals running!**

## Step 3: Configure MetaMask for Local Testing

### Add Localhost Network

1. Open MetaMask
2. Click network dropdown (top left)
3. Click "Add Network" → "Add network manually"
4. Enter:
   - **Network Name**: Localhost 8545
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH
5. Click "Save"

### Import Test Accounts

Import the private keys from Terminal 1 output:

**Account #0 - Admin** (already in MetaMask by default if using test network)
```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Account #1 - Producer**
```
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

**Account #2 - Supplier**
```
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

**Account #3 - Retailer**
```
Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
```

**Account #4 - Consumer**
```
Private Key: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a
```

**Account #5 - Regulator**
```
Private Key: 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba
```

To import:
1. MetaMask → Click account icon → "Add account or hardware wallet"
2. Select "Import account"
3. Paste private key
4. Give it a friendly name (e.g., "Local Producer", "Local Supplier")

## Step 4: Create React Frontend

Now let's create a basic React app structure:

```bash
# Create React app in frontend directory
npx create-react-app frontend

# Install required dependencies
cd frontend
npm install ethers@6
```

## Step 5: Test the Complete Workflow

### Testing Scenario: COVID-19 Vaccine Journey

1. **Switch to Admin Account** in MetaMask
   - Verify admin role
   - View all products

2. **Switch to Producer Account**
   - Register a new vaccine batch
   - View products you created
   - Transfer product to supplier

3. **Switch to Supplier Account**
   - View received products
   - Update status to "In Transit"
   - Deliver to retailer

4. **Switch to Retailer Account**
   - Receive product
   - Update to "In Stock"
   - Sell to consumer

5. **Switch to Consumer Account**
   - View purchased products
   - See complete product history

6. **Switch to Regulator Account**
   - Audit any product
   - View complete supply chain

### What You Can Test

✅ **Role-Based Access Control**
- Each role can only perform their authorized actions
- Unauthorized actions are blocked

✅ **Product Lifecycle**
- Creation → Shipment → Transit → Storage → Sale
- All state transitions tracked

✅ **Ownership Transfers**
- Product custody changes hands
- Each transfer recorded

✅ **Audit Trail**
- Complete history for every product
- Immutable record of all events

✅ **Regulator Oversight**
- Can view any product at any time
- Full transparency

## Benefits of Local Testing

🚀 **Instant Transactions** - No waiting for block confirmations  
💰 **Free** - No real ETH or testnet faucets needed  
🔄 **Reset Anytime** - Restart Hardhat node for fresh state  
🐛 **Easy Debugging** - See all transactions in terminal  
⚡ **Fast Iteration** - Make changes and test immediately  

## Common Commands

```bash
# Terminal 1 - Start local blockchain
npm run node

# Terminal 2 - Deploy contracts
npm run deploy:local

# Terminal 3 - Start React app
cd frontend && npm start

# Recompile contracts after changes
npm run compile

# Reset local blockchain (Terminal 1)
# Just restart: npm run node
```

## Troubleshooting

### "Nonce too high" error
**Solution**: Reset MetaMask for localhost network
1. MetaMask → Settings → Advanced
2. Scroll to "Clear activity tab data"
3. Click "Clear"

### Contract not found
**Solution**: Make sure you deployed to the running network
```bash
npm run deploy:local
```

### Wrong network
**Solution**: Switch MetaMask to "Localhost 8545"

### Changes not reflecting
**Solution**: 
1. Recompile: `npm run compile`
2. Restart Hardhat node (Terminal 1)
3. Redeploy: `npm run deploy:local`
4. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)

## Next Steps

Once you're happy with local testing:
1. Deploy to Sepolia testnet for public testing
2. Add more complex UI features
3. Integrate IPFS for metadata storage
4. Add QR code scanning for consumers

## File Structure

```
CSE540Group30/
├── contracts/              # Solidity smart contracts
├── scripts/
│   ├── deploy-local.js   # Local deployment script
│   └── deploy.js         # Testnet deployment script
├── frontend/
│   └── src/
│       ├── contracts/     # Auto-generated: ABIs and addresses
│       ├── components/    # React components for each role
│       └── App.js         # Main app with wallet connection
└── test/                  # Contract tests
```

Happy testing! 🎉

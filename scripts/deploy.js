import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  console.log("🚀 Starting PharmaTrace deployment...\n");

  const isLocal = hre.network.name === "localhost";
  const rpcUrl = hre.network.config?.url || process.env.SEPOLIA_RPC_URL || "http://127.0.0.1:8545";
  const defaultLocalKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const privateKey = process.env.PRIVATE_KEY || (isLocal ? defaultLocalKey : null);

  if (!privateKey) {
    throw new Error("PRIVATE_KEY not set. Add it to your .env before deploying.");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const deployer = new ethers.Wallet(privateKey, provider);
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy Provenance contract (which includes AccessControl)
  console.log("📦 Deploying Provenance contract...");
  const artifact = await hre.artifacts.readArtifact("Provenance");
  const Provenance = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
  const provenance = await Provenance.deploy();
  
  await provenance.waitForDeployment();
  const provenanceAddress = await provenance.getAddress();
  
  console.log("✅ Provenance deployed to:", provenanceAddress);
  console.log("   - Includes PharmaTraceAccessControl");
  console.log("   - Admin role granted to:", deployer.address);
  
  // Verify role constants
  console.log("\n🔐 Role Identifiers:");
  const PRODUCER_ROLE = await provenance.PRODUCER_ROLE();
  const SUPPLIER_ROLE = await provenance.SUPPLIER_ROLE();
  const RETAILER_ROLE = await provenance.RETAILER_ROLE();
  const CONSUMER_ROLE = await provenance.CONSUMER_ROLE();
  const REGULATOR_ROLE = await provenance.REGULATOR_ROLE();
  const DEFAULT_ADMIN_ROLE = await provenance.DEFAULT_ADMIN_ROLE();
  
  console.log("   - PRODUCER_ROLE:", PRODUCER_ROLE);
  console.log("   - SUPPLIER_ROLE:", SUPPLIER_ROLE);
  console.log("   - RETAILER_ROLE:", RETAILER_ROLE);
  console.log("   - CONSUMER_ROLE:", CONSUMER_ROLE);
  console.log("   - REGULATOR_ROLE:", REGULATOR_ROLE);
  console.log("   - DEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN_ROLE);

  // Optionally hand off DEFAULT_ADMIN_ROLE to a specified wallet
  const targetAdmin = process.env.ADMIN_ADDRESS;
  if (targetAdmin) {
    const alreadyAdmin = await provenance.hasRole(DEFAULT_ADMIN_ROLE, targetAdmin);
    if (!alreadyAdmin) {
      console.log(`\n👤 Granting DEFAULT_ADMIN_ROLE to ${targetAdmin}...`);
      const grantTx = await provenance.grantRole(DEFAULT_ADMIN_ROLE, targetAdmin);
      await grantTx.wait();
      console.log("   ✓ Admin role granted");
    } else {
      console.log(`\nℹ️ ${targetAdmin} already has DEFAULT_ADMIN_ROLE`);
    }

    if (process.env.REVOKE_DEPLOYER_ADMIN === "true" && targetAdmin.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log(`🔐 Revoking DEFAULT_ADMIN_ROLE from deployer ${deployer.address}...`);
      const revokeTx = await provenance.revokeRole(DEFAULT_ADMIN_ROLE, deployer.address);
      await revokeTx.wait();
      console.log("   ✓ Deployer admin role revoked");
    }
  }
  
  console.log("\n✨ Deployment Summary:");
  console.log("=" .repeat(60));
  console.log("Contract Address:", provenanceAddress);
  const network = await provider.getNetwork();
  console.log("Network:", network.name || hre.network.name);
  console.log("Chain ID:", network.chainId);
  console.log("Deployer:", deployer.address);
  console.log("=" .repeat(60));
  
  console.log("\n📋 Next Steps:");
  console.log("1. Save the contract address for your records");
  console.log("2. Grant roles to stakeholder addresses using:");
  console.log("   - grantProducerRole(address)");
  console.log("   - grantSupplierRole(address)");
  console.log("   - grantRetailerRole(address)");
  console.log("   - grantConsumerRole(address)");
  console.log("   - grantRegulatorRole(address)");
  console.log("3. Verify contract on block explorer (if on testnet/mainnet)");
  
  // Return deployment info for scripts that import this
  return {
    provenance,
    provenanceAddress,
    deployer: deployer.address
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

export default main;

import hre from "hardhat";

async function main() {
  const ethers = hre.ethers;
  console.log("🚀 Starting PharmaTrace deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy Provenance contract (which includes AccessControl)
  console.log("📦 Deploying Provenance contract...");
  const Provenance = await ethers.getContractFactory("Provenance");
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
  
  console.log("\n✨ Deployment Summary:");
  console.log("=" .repeat(60));
  console.log("Contract Address:", provenanceAddress);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
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

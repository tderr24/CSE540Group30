import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Deploy contracts to local Hardhat network and save addresses
 * This script is meant to be run with: npx hardhat run scripts/deploy-local.cjs --network localhost
 */
async function main() {
  console.log("🚀 Deploying PharmaTrace to Local Network...\n");

  // Get signers
  const [admin, producer1, supplier1, retailer1, consumer1, regulator1] = await hre.ethers.getSigners();

  console.log("📝 Deployer Account:", admin.address);
  console.log("💰 Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(admin.address)), "ETH\n");

  // Deploy Provenance contract
  console.log("📦 Deploying Provenance contract...");
  const Provenance = await hre.ethers.getContractFactory("Provenance");
  const provenance = await Provenance.deploy();
  await provenance.waitForDeployment();
  const provenanceAddress = await provenance.getAddress();
  
  console.log("✅ Provenance deployed to:", provenanceAddress);
  console.log();

  // Grant roles to test accounts
  console.log("🔐 Setting up test accounts with roles...");
  
  await provenance.grantProducerRole(producer1.address);
  console.log("   ✓ Producer:", producer1.address);
  
  await provenance.grantSupplierRole(supplier1.address);
  console.log("   ✓ Supplier:", supplier1.address);
  
  await provenance.grantRetailerRole(retailer1.address);
  console.log("   ✓ Retailer:", retailer1.address);
  
  await provenance.grantConsumerRole(consumer1.address);
  console.log("   ✓ Consumer:", consumer1.address);
  
  await provenance.grantRegulatorRole(regulator1.address);
  console.log("   ✓ Regulator:", regulator1.address);
  console.log();

  // Create sample products for testing
  console.log("💊 Creating sample products...");
  
  const productId1 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("BATCH-2025-001"));
  await provenance.connect(producer1).registerProduct(
    productId1,
    "COVID-19 Vaccine - Pfizer",
    "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
  );
  console.log("   ✓ Product 1:", "COVID-19 Vaccine - Pfizer");
  
  const productId2 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("BATCH-2025-002"));
  await provenance.connect(producer1).registerProduct(
    productId2,
    "Insulin - Novo Nordisk",
    "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
  );
  console.log("   ✓ Product 2:", "Insulin - Novo Nordisk");
  console.log();

  // Save deployment info for frontend
  const deploymentInfo = {
    network: "localhost",
    chainId: 31337,
    contractAddress: provenanceAddress,
    accounts: {
      admin: admin.address,
      producer: producer1.address,
      supplier: supplier1.address,
      retailer: retailer1.address,
      consumer: consumer1.address,
      regulator: regulator1.address
    },
    sampleProducts: {
      product1: productId1,
      product2: productId2
    },
    deploymentTime: new Date().toISOString()
  };

  // Save to frontend directory (we'll create this structure)
  const deploymentsDir = path.join(__dirname, "..", "frontend", "src", "contracts");
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  fs.writeFileSync(
    path.join(deploymentsDir, "deployment.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Copy contract ABI
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "Provenance.sol", "Provenance.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  fs.writeFileSync(
    path.join(deploymentsDir, "Provenance.json"),
    JSON.stringify({ abi: artifact.abi }, null, 2)
  );

  console.log("✨ Deployment Complete!");
  console.log("=" .repeat(70));
  console.log("Contract Address:", provenanceAddress);
  console.log("Network: Hardhat Local (localhost:8545)");
  console.log("Chain ID: 31337");
  console.log("=" .repeat(70));
  console.log("\n📋 Next Steps:");
  console.log("1. Import these accounts into MetaMask:");
  console.log("   - Add 'Localhost 8545' network (Chain ID: 31337)");
  console.log("   - Import private keys from Hardhat accounts");
  console.log("\n2. Start your React frontend:");
  console.log("   cd frontend && npm start");
  console.log("\n3. Contract info saved to: frontend/src/contracts/");
  console.log();

  return {
    provenance,
    provenanceAddress,
    accounts: deploymentInfo.accounts,
    productIds: [productId1, productId2]
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

export default main;

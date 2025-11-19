const hre = require("hardhat");

/**
 * Setup script to grant roles and create sample products for testing/demo
 * Run this after deploying the contract
 */
async function main() {
  const ethers = hre.ethers;
  console.log("🔧 Setting up PharmaTrace test environment...\n");

  // Get accounts
  const [admin, producer, supplier, retailer, consumer, regulator] = await ethers.getSigners();

  console.log("👥 Accounts:");
  console.log("   Admin:", admin.address);
  console.log("   Producer:", producer.address);
  console.log("   Supplier:", supplier.address);
  console.log("   Retailer:", retailer.address);
  console.log("   Consumer:", consumer.address);
  console.log("   Regulator:", regulator.address);
  console.log();

  // Deploy contract
  console.log("📦 Deploying Provenance contract...");
  const Provenance = await ethers.getContractFactory("Provenance");
  const provenance = await Provenance.deploy();
  await provenance.waitForDeployment();
  const contractAddress = await provenance.getAddress();
  console.log("✅ Contract deployed to:", contractAddress);
  console.log();

  // Grant roles
  console.log("🔐 Granting roles to stakeholders...");
  
  await provenance.connect(admin).grantProducerRole(producer.address);
  console.log("   ✓ Producer role granted to:", producer.address);
  
  await provenance.connect(admin).grantSupplierRole(supplier.address);
  console.log("   ✓ Supplier role granted to:", supplier.address);
  
  await provenance.connect(admin).grantRetailerRole(retailer.address);
  console.log("   ✓ Retailer role granted to:", retailer.address);
  
  await provenance.connect(admin).grantConsumerRole(consumer.address);
  console.log("   ✓ Consumer role granted to:", consumer.address);
  
  await provenance.connect(admin).grantRegulatorRole(regulator.address);
  console.log("   ✓ Regulator role granted to:", regulator.address);
  console.log();

  // Create sample products
  console.log("💊 Creating sample products...\n");

  const sampleProducts = [
    {
      batchId: "BATCH-2025-001",
      name: "COVID-19 Vaccine - Pfizer",
      metadata: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
    },
    {
      batchId: "BATCH-2025-002",
      name: "Insulin - Novo Nordisk",
      metadata: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
    },
    {
      batchId: "BATCH-2025-003",
      name: "Aspirin - Bayer",
      metadata: "QmR7GSQM93Cx5eAg6a6yRzNde1FQv7uL6X1o4k7zrJa3LX"
    }
  ];

  const productIds = [];

  for (const product of sampleProducts) {
    const productId = ethers.keccak256(ethers.toUtf8Bytes(product.batchId));
    productIds.push(productId);

    console.log(`📦 Product: ${product.name}`);
    console.log(`   Batch ID: ${product.batchId}`);
    console.log(`   Product ID: ${productId}`);
    console.log(`   IPFS Hash: ${product.metadata}`);

    // Producer registers the product
    const tx = await provenance.connect(producer).registerProduct(
      productId,
      product.name,
      product.metadata
    );
    await tx.wait();
    console.log("   ✅ Registered by producer");
    console.log();
  }

  // Demonstrate a complete product journey for the first product
  console.log("🚚 Demonstrating complete product journey for first product...\n");
  
  const firstProductId = productIds[0];
  
  console.log("1️⃣  Producer ships to Supplier");
  let tx = await provenance.connect(producer).transferProduct(firstProductId, supplier.address, 1);
  await tx.wait();
  console.log("   ✅ Status: Shipped\n");
  
  console.log("2️⃣  Supplier marks as In Transit");
  tx = await provenance.connect(supplier).updateProductStatus(firstProductId, 2);
  await tx.wait();
  console.log("   ✅ Status: InTransit\n");
  
  console.log("3️⃣  Supplier delivers to Retailer");
  tx = await provenance.connect(supplier).transferProduct(firstProductId, retailer.address, 3);
  await tx.wait();
  console.log("   ✅ Status: Received\n");
  
  console.log("4️⃣  Retailer puts in stock");
  tx = await provenance.connect(retailer).updateProductStatus(firstProductId, 4);
  await tx.wait();
  console.log("   ✅ Status: InStock\n");
  
  console.log("5️⃣  Retailer sells to Consumer");
  tx = await provenance.connect(retailer).transferProduct(firstProductId, consumer.address, 5);
  await tx.wait();
  console.log("   ✅ Status: Sold\n");

  // Show product history
  console.log("📜 Product History:");
  const history = await provenance.getProductHistory(firstProductId);
  console.log(`   Total events: ${history.length}`);
  
  const statusNames = ["Created", "Shipped", "InTransit", "Received", "InStock", "Sold", "Flagged"];
  for (let i = 0; i < history.length; i++) {
    const event = history[i];
    console.log(`   ${i + 1}. ${statusNames[event.newStatus]} by ${event.actor}`);
  }
  console.log();

  // Test regulator access
  console.log("🔍 Regulator performing audit...");
  const productDetails = await provenance.connect(regulator).regulatorCheckProduct(firstProductId);
  console.log("   ✅ Regulator verified product:", productDetails.name);
  console.log("   Current Owner:", productDetails.currentOwner);
  console.log("   Status:", statusNames[productDetails.status]);
  console.log();

  console.log("✨ Setup Complete!");
  console.log("=" .repeat(60));
  console.log("Contract Address:", contractAddress);
  console.log("Products Created:", sampleProducts.length);
  console.log("Complete Journey Demonstrated: 1 product");
  console.log("=" .repeat(60));

  return {
    provenance,
    contractAddress,
    accounts: { admin, producer, supplier, retailer, consumer, regulator },
    productIds
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });

module.exports = main;

const hre = require("hardhat");

/**
 * Verification script to test PharmaTrace contracts
 * This demonstrates all functionality without needing Mocha
 */
async function main() {
  const ethers = hre.ethers;
  console.log("🧪 Running PharmaTrace Contract Verification\n");
  console.log("=" .repeat(70));
  
  let passedTests = 0;
  let failedTests = 0;
  
  try {
    // Deploy contract
    console.log("\n📦 1. Deploying Provenance Contract...");
    const [admin, producer, supplier, retailer, consumer, regulator, unauthorized] = 
      await ethers.getSigners();
    
    const Provenance = await ethers.getContractFactory("Provenance");
    const provenance = await Provenance.deploy();
    await provenance.waitForDeployment();
    console.log("   ✅ Contract deployed successfully");
    passedTests++;
    
    // Test 2: Check admin role
    console.log("\n🔐 2. Verifying Admin Role...");
    const DEFAULT_ADMIN_ROLE = await provenance.DEFAULT_ADMIN_ROLE();
    const hasAdminRole = await provenance.hasRole(DEFAULT_ADMIN_ROLE, admin.address);
    if (hasAdminRole) {
      console.log("   ✅ Admin role correctly assigned to deployer");
      passedTests++;
    } else {
      console.log("   ❌ Admin role NOT assigned");
      failedTests++;
    }
    
    // Test 3: Grant roles
    console.log("\n👥 3. Granting Stakeholder Roles...");
    await provenance.connect(admin).grantProducerRole(producer.address);
    await provenance.connect(admin).grantSupplierRole(supplier.address);
    await provenance.connect(admin).grantRetailerRole(retailer.address);
    await provenance.connect(admin).grantConsumerRole(consumer.address);
    await provenance.connect(admin).grantRegulatorRole(regulator.address);
    
    const PRODUCER_ROLE = await provenance.PRODUCER_ROLE();
    const hasProducerRole = await provenance.hasRole(PRODUCER_ROLE, producer.address);
    if (hasProducerRole) {
      console.log("   ✅ All roles granted successfully");
      passedTests++;
    } else {
      console.log("   ❌ Role granting failed");
      failedTests++;
    }
    
    // Test 4: Register product
    console.log("\n💊 4. Registering Product (Creation Phase)...");
    const productId = ethers.keccak256(ethers.toUtf8Bytes("BATCH-2025-001"));
    const productName = "COVID-19 Vaccine";
    const metadataHash = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
    
    const tx1 = await provenance.connect(producer).registerProduct(
      productId,
      productName,
      metadataHash
    );
    await tx1.wait();
    
    const product = await provenance.getProductDetails(productId);
    if (product.name === productName && product.currentOwner === producer.address) {
      console.log("   ✅ Product registered successfully");
      console.log(`      Product: ${product.name}`);
      console.log(`      Owner: ${product.currentOwner}`);
      passedTests++;
    } else {
      console.log("   ❌ Product registration failed");
      failedTests++;
    }
    
    // Test 5: Transfer product (Shipment Phase)
    console.log("\n🚚 5. Transferring Product to Supplier (Shipment)...");
    const tx2 = await provenance.connect(producer).transferProduct(
      productId,
      supplier.address,
      1 // Shipped
    );
    await tx2.wait();
    
    const product2 = await provenance.getProductDetails(productId);
    if (product2.currentOwner === supplier.address && product2.status === 1) {
      console.log("   ✅ Product transferred successfully");
      console.log(`      New Owner: ${product2.currentOwner}`);
      console.log(`      Status: Shipped`);
      passedTests++;
    } else {
      console.log("   ❌ Product transfer failed");
      failedTests++;
    }
    
    // Test 6: Update status (Transit Phase)
    console.log("\n📦 6. Updating Status to In Transit...");
    const tx3 = await provenance.connect(supplier).updateProductStatus(productId, 2);
    await tx3.wait();
    
    const product3 = await provenance.getProductDetails(productId);
    if (product3.status === 2) {
      console.log("   ✅ Status updated successfully");
      console.log(`      Status: InTransit`);
      passedTests++;
    } else {
      console.log("   ❌ Status update failed");
      failedTests++;
    }
    
    // Test 7: Transfer to retailer (Storage Phase)
    console.log("\n🏪 7. Transferring to Retailer (Storage)...");
    const tx4 = await provenance.connect(supplier).transferProduct(
      productId,
      retailer.address,
      3 // Received
    );
    await tx4.wait();
    
    const product4 = await provenance.getProductDetails(productId);
    if (product4.currentOwner === retailer.address && product4.status === 3) {
      console.log("   ✅ Product received by retailer");
      console.log(`      Status: Received`);
      passedTests++;
    } else {
      console.log("   ❌ Retailer transfer failed");
      failedTests++;
    }
    
    // Test 8: Mark as in stock
    console.log("\n📍 8. Marking Product as In Stock...");
    const tx5 = await provenance.connect(retailer).updateProductStatus(productId, 4);
    await tx5.wait();
    
    const product5 = await provenance.getProductDetails(productId);
    if (product5.status === 4) {
      console.log("   ✅ Product in stock");
      passedTests++;
    } else {
      console.log("   ❌ In stock update failed");
      failedTests++;
    }
    
    // Test 9: Sell to consumer (Delivery Phase)
    console.log("\n🎯 9. Selling to Consumer (Delivery)...");
    const tx6 = await provenance.connect(retailer).transferProduct(
      productId,
      consumer.address,
      5 // Sold
    );
    await tx6.wait();
    
    const product6 = await provenance.getProductDetails(productId);
    if (product6.currentOwner === consumer.address && product6.status === 5) {
      console.log("   ✅ Product sold to consumer");
      console.log(`      Final Owner: ${product6.currentOwner}`);
      console.log(`      Status: Sold`);
      passedTests++;
    } else {
      console.log("   ❌ Sale to consumer failed");
      failedTests++;
    }
    
    // Test 10: View history
    console.log("\n📜 10. Verifying Product History (Immutability)...");
    const history = await provenance.getProductHistory(productId);
    const statusNames = ["Created", "Shipped", "InTransit", "Received", "InStock", "Sold"];
    
    console.log(`   Total events recorded: ${history.length}`);
    for (let i = 0; i < history.length; i++) {
      const event = history[i];
      console.log(`      ${i + 1}. ${statusNames[event.newStatus]} by ${event.actor.slice(0, 10)}...`);
    }
    
    if (history.length === 7) {
      console.log("   ✅ Complete history recorded");
      passedTests++;
    } else {
      console.log("   ❌ History incomplete");
      failedTests++;
    }
    
    // Test 11: Regulator access
    console.log("\n🔍 11. Testing Regulator Access...");
    const regulatorProduct = await provenance.connect(regulator).regulatorCheckProduct(productId);
    if (regulatorProduct.name === productName) {
      console.log("   ✅ Regulator can audit product");
      passedTests++;
    } else {
      console.log("   ❌ Regulator access failed");
      failedTests++;
    }
    
    // Test 12: Unauthorized access prevention
    console.log("\n🚫 12. Testing Access Control (Unauthorized User)...");
    try {
      await provenance.connect(unauthorized).registerProduct(
        ethers.keccak256(ethers.toUtf8Bytes("FAKE")),
        "Fake Product",
        "fake-hash"
      );
      console.log("   ❌ Unauthorized user was able to register product");
      failedTests++;
    } catch (error) {
      console.log("   ✅ Unauthorized access correctly prevented");
      passedTests++;
    }
    
    // Test 13: Duplicate product prevention
    console.log("\n🔒 13. Testing Duplicate Product Prevention...");
    try {
      await provenance.connect(producer).registerProduct(
        productId,
        "Duplicate",
        "duplicate-hash"
      );
      console.log("   ❌ Duplicate product was allowed");
      failedTests++;
    } catch (error) {
      console.log("   ✅ Duplicate product correctly prevented");
      passedTests++;
    }
    
    // Results
    console.log("\n" + "=".repeat(70));
    console.log("📊 TEST RESULTS");
    console.log("=".repeat(70));
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
    console.log("=".repeat(70));
    
    if (failedTests === 0) {
      console.log("\n🎉 All tests passed! Contract is working correctly.\n");
    } else {
      console.log("\n⚠️  Some tests failed. Please review the output above.\n");
    }
    
  } catch (error) {
    console.error("\n❌ Error during verification:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

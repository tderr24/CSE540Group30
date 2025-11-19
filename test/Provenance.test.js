import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Provenance", function () {
  // Fixture to deploy the contract and set up roles
  async function deployProvenanceFixture() {
    const [admin, producer, supplier, retailer, consumer, regulator, unauthorized] = 
      await ethers.getSigners();

    const Provenance = await ethers.getContractFactory("Provenance");
    const provenance = await Provenance.deploy();

    // Grant roles
    await provenance.connect(admin).grantProducerRole(producer.address);
    await provenance.connect(admin).grantSupplierRole(supplier.address);
    await provenance.connect(admin).grantRetailerRole(retailer.address);
    await provenance.connect(admin).grantConsumerRole(consumer.address);
    await provenance.connect(admin).grantRegulatorRole(regulator.address);

    // Sample product data
    const productId = ethers.keccak256(ethers.toUtf8Bytes("BATCH-2025-001"));
    const productName = "COVID-19 Vaccine";
    const metadataHash = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"; // Example IPFS hash

    return { 
      provenance, 
      admin, 
      producer, 
      supplier, 
      retailer, 
      consumer,
      regulator, 
      unauthorized,
      productId,
      productName,
      metadataHash
    };
  }

  describe("Deployment", function () {
    it("Should inherit access control and set admin properly", async function () {
      const { provenance, admin } = await loadFixture(deployProvenanceFixture);
      
      const DEFAULT_ADMIN_ROLE = await provenance.DEFAULT_ADMIN_ROLE();
      expect(await provenance.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
    });
  });

  describe("Product Registration (Creation Phase)", function () {
    it("Should allow producer to register a new product", async function () {
      const { provenance, producer, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await expect(
        provenance.connect(producer).registerProduct(productId, productName, metadataHash)
      )
        .to.emit(provenance, "ProductRegistered")
        .withArgs(productId, producer.address, productName)
        .to.emit(provenance, "StatusUpdated");

      // Verify product details
      const product = await provenance.getProductDetails(productId);
      expect(product.productId).to.equal(productId);
      expect(product.name).to.equal(productName);
      expect(product.currentOwner).to.equal(producer.address);
      expect(product.status).to.equal(0); // ProductStatus.Created
      expect(product.metadataHash).to.equal(metadataHash);
    });

    it("Should revert if non-producer tries to register product", async function () {
      const { provenance, supplier, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await expect(
        provenance.connect(supplier).registerProduct(productId, productName, metadataHash)
      ).to.be.reverted;
    });

    it("Should revert if product ID is zero", async function () {
      const { provenance, producer, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await expect(
        provenance.connect(producer).registerProduct(ethers.ZeroHash, productName, metadataHash)
      ).to.be.revertedWithCustomError(provenance, "InvalidProductId");
    });

    it("Should revert if product name is empty", async function () {
      const { provenance, producer, productId, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await expect(
        provenance.connect(producer).registerProduct(productId, "", metadataHash)
      ).to.be.revertedWithCustomError(provenance, "EmptyProductName");
    });

    it("Should revert if metadata hash is empty", async function () {
      const { provenance, producer, productId, productName } = 
        await loadFixture(deployProvenanceFixture);

      await expect(
        provenance.connect(producer).registerProduct(productId, productName, "")
      ).to.be.revertedWithCustomError(provenance, "EmptyMetadataHash");
    });

    it("Should revert if product already exists (prevent duplicates)", async function () {
      const { provenance, producer, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      // Register product first time
      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);

      // Try to register again
      await expect(
        provenance.connect(producer).registerProduct(productId, productName, metadataHash)
      ).to.be.revertedWithCustomError(provenance, "ProductAlreadyExists");
    });

    it("Should record initial history event", async function () {
      const { provenance, producer, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);

      const history = await provenance.getProductHistory(productId);
      expect(history.length).to.equal(1);
      expect(history[0].actor).to.equal(producer.address);
      expect(history[0].newStatus).to.equal(0); // ProductStatus.Created
    });
  });

  describe("Ownership/Custody Transfer (Shipment Phase)", function () {
    it("Should allow producer to transfer product to supplier", async function () {
      const { provenance, producer, supplier, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      // Register product
      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);

      // Transfer to supplier with Shipped status
      await expect(
        provenance.connect(producer).transferProduct(productId, supplier.address, 1) // ProductStatus.Shipped
      )
        .to.emit(provenance, "OwnershipTransferred")
        .withArgs(productId, producer.address, supplier.address)
        .to.emit(provenance, "StatusUpdated");

      // Verify ownership changed
      const product = await provenance.getProductDetails(productId);
      expect(product.currentOwner).to.equal(supplier.address);
      expect(product.status).to.equal(1); // ProductStatus.Shipped
    });

    it("Should allow supplier to transfer product to retailer", async function () {
      const { provenance, producer, supplier, retailer, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      // Register and transfer to supplier
      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);
      await provenance.connect(producer).transferProduct(productId, supplier.address, 1);

      // Supplier transfers to retailer
      await expect(
        provenance.connect(supplier).transferProduct(productId, retailer.address, 3) // ProductStatus.Received
      )
        .to.emit(provenance, "OwnershipTransferred")
        .withArgs(productId, supplier.address, retailer.address);

      const product = await provenance.getProductDetails(productId);
      expect(product.currentOwner).to.equal(retailer.address);
      expect(product.status).to.equal(3); // ProductStatus.Received
    });

    it("Should revert if non-owner tries to transfer product", async function () {
      const { provenance, producer, supplier, unauthorized, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);

      await expect(
        provenance.connect(unauthorized).transferProduct(productId, supplier.address, 1)
      ).to.be.revertedWithCustomError(provenance, "NotProductOwner");
    });

    it("Should revert if transferring to zero address", async function () {
      const { provenance, producer, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);

      await expect(
        provenance.connect(producer).transferProduct(productId, ethers.ZeroAddress, 1)
      ).to.be.revertedWithCustomError(provenance, "InvalidNewOwner");
    });

    it("Should revert if product does not exist", async function () {
      const { provenance, producer, supplier } = await loadFixture(deployProvenanceFixture);

      const fakeProductId = ethers.keccak256(ethers.toUtf8Bytes("FAKE-BATCH"));

      await expect(
        provenance.connect(producer).transferProduct(fakeProductId, supplier.address, 1)
      ).to.be.revertedWithCustomError(provenance, "ProductDoesNotExist");
    });
  });

  describe("Status Updates (Storage & Transit Phases)", function () {
    it("Should allow owner to update product status without transfer", async function () {
      const { provenance, producer, supplier, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);
      await provenance.connect(producer).transferProduct(productId, supplier.address, 1);

      // Supplier updates status to InTransit
      await expect(
        provenance.connect(supplier).updateProductStatus(productId, 2) // ProductStatus.InTransit
      )
        .to.emit(provenance, "StatusUpdated")
        .withArgs(productId, 2, supplier.address);

      const product = await provenance.getProductDetails(productId);
      expect(product.status).to.equal(2); // ProductStatus.InTransit
      expect(product.currentOwner).to.equal(supplier.address); // Owner should not change
    });

    it("Should allow retailer to update status to InStock", async function () {
      const { provenance, producer, supplier, retailer, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);
      await provenance.connect(producer).transferProduct(productId, supplier.address, 1);
      await provenance.connect(supplier).transferProduct(productId, retailer.address, 3);

      // Retailer marks as InStock
      await provenance.connect(retailer).updateProductStatus(productId, 4); // ProductStatus.InStock

      const product = await provenance.getProductDetails(productId);
      expect(product.status).to.equal(4);
    });

    it("Should allow marking product as Sold", async function () {
      const { provenance, producer, supplier, retailer, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);
      await provenance.connect(producer).transferProduct(productId, supplier.address, 1);
      await provenance.connect(supplier).transferProduct(productId, retailer.address, 3);
      await provenance.connect(retailer).updateProductStatus(productId, 4);

      // Retailer marks as Sold
      await provenance.connect(retailer).updateProductStatus(productId, 5); // ProductStatus.Sold

      const product = await provenance.getProductDetails(productId);
      expect(product.status).to.equal(5);
    });

    it("Should allow flagging a product", async function () {
      const { provenance, producer, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);

      // Flag product (e.g., temperature anomaly detected)
      await provenance.connect(producer).updateProductStatus(productId, 6); // ProductStatus.Flagged

      const product = await provenance.getProductDetails(productId);
      expect(product.status).to.equal(6);
    });

    it("Should revert if non-owner tries to update status", async function () {
      const { provenance, producer, unauthorized, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);

      await expect(
        provenance.connect(unauthorized).updateProductStatus(productId, 1)
      ).to.be.revertedWithCustomError(provenance, "NotProductOwner");
    });
  });

  describe("Complete Product Journey", function () {
    it("Should track full lifecycle: Creation → Shipment → Storage → Delivery", async function () {
      const { provenance, producer, supplier, retailer, consumer, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      // 1. Creation: Producer registers product
      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);
      let product = await provenance.getProductDetails(productId);
      expect(product.status).to.equal(0); // Created
      expect(product.currentOwner).to.equal(producer.address);

      // 2. Shipment: Producer ships to Supplier
      await provenance.connect(producer).transferProduct(productId, supplier.address, 1); // Shipped
      product = await provenance.getProductDetails(productId);
      expect(product.status).to.equal(1); // Shipped
      expect(product.currentOwner).to.equal(supplier.address);

      // 3. Transit: Supplier marks as in transit
      await provenance.connect(supplier).updateProductStatus(productId, 2); // InTransit
      product = await provenance.getProductDetails(productId);
      expect(product.status).to.equal(2); // InTransit

      // 4. Storage: Supplier delivers to Retailer
      await provenance.connect(supplier).transferProduct(productId, retailer.address, 3); // Received
      product = await provenance.getProductDetails(productId);
      expect(product.status).to.equal(3); // Received
      expect(product.currentOwner).to.equal(retailer.address);

      // 5. Storage: Retailer puts in stock
      await provenance.connect(retailer).updateProductStatus(productId, 4); // InStock
      product = await provenance.getProductDetails(productId);
      expect(product.status).to.equal(4); // InStock

      // 6. Delivery: Retailer sells to Consumer
      await provenance.connect(retailer).transferProduct(productId, consumer.address, 5); // Sold
      product = await provenance.getProductDetails(productId);
      expect(product.status).to.equal(5); // Sold
      expect(product.currentOwner).to.equal(consumer.address);

      // Verify complete history
      const history = await provenance.getProductHistory(productId);
      expect(history.length).to.equal(7); // All state changes recorded
    });
  });

  describe("Product History and Auditability", function () {
    it("Should maintain immutable history of all events", async function () {
      const { provenance, producer, supplier, retailer, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);
      await provenance.connect(producer).transferProduct(productId, supplier.address, 1);
      await provenance.connect(supplier).transferProduct(productId, retailer.address, 3);

      const history = await provenance.getProductHistory(productId);
      
      // Verify all events are recorded
      expect(history.length).to.equal(3);
      expect(history[0].actor).to.equal(producer.address);
      expect(history[0].newStatus).to.equal(0); // Created
      expect(history[1].actor).to.equal(producer.address);
      expect(history[1].newStatus).to.equal(1); // Shipped
      expect(history[2].actor).to.equal(supplier.address);
      expect(history[2].newStatus).to.equal(3); // Received
    });

    it("Should link each event to responsible stakeholder", async function () {
      const { provenance, producer, supplier, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);
      await provenance.connect(producer).transferProduct(productId, supplier.address, 1);

      const history = await provenance.getProductHistory(productId);
      
      // Each event shows who performed it
      expect(history[0].actor).to.equal(producer.address);
      expect(history[1].actor).to.equal(producer.address);
    });

    it("Should include timestamps for verification", async function () {
      const { provenance, producer, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      const timestamp = await time.latest();
      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);

      const history = await provenance.getProductHistory(productId);
      expect(history[0].timestamp).to.be.greaterThan(timestamp);
    });
  });

  describe("Regulator Functions (Verification & Validation)", function () {
    it("Should allow regulator to check any product", async function () {
      const { provenance, producer, regulator, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);

      const product = await provenance.connect(regulator).regulatorCheckProduct(productId);
      expect(product.productId).to.equal(productId);
      expect(product.name).to.equal(productName);
    });

    it("Should revert if non-regulator tries to use regulator function", async function () {
      const { provenance, producer, unauthorized, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);

      await expect(
        provenance.connect(unauthorized).regulatorCheckProduct(productId)
      ).to.be.reverted;
    });
  });

  describe("View Functions", function () {
    it("Should allow anyone to view product details", async function () {
      const { provenance, producer, unauthorized, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);

      // Unauthorized user can still view (public verification)
      const product = await provenance.connect(unauthorized).getProductDetails(productId);
      expect(product.name).to.equal(productName);
    });

    it("Should allow anyone to view product history", async function () {
      const { provenance, producer, unauthorized, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);

      const history = await provenance.connect(unauthorized).getProductHistory(productId);
      expect(history.length).to.equal(1);
    });

    it("Should revert when querying non-existent product", async function () {
      const { provenance } = await loadFixture(deployProvenanceFixture);

      const fakeId = ethers.keccak256(ethers.toUtf8Bytes("FAKE"));

      await expect(
        provenance.getProductDetails(fakeId)
      ).to.be.revertedWithCustomError(provenance, "ProductDoesNotExist");
    });
  });

  describe("Error Handling and Safeguards", function () {
    it("Should prevent tampering by non-owners", async function () {
      const { provenance, producer, unauthorized, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);

      // Unauthorized user cannot modify
      await expect(
        provenance.connect(unauthorized).updateProductStatus(productId, 6)
      ).to.be.revertedWithCustomError(provenance, "NotProductOwner");
    });

    it("Should maintain data integrity through storage", async function () {
      const { provenance, producer, productId, productName, metadataHash } = 
        await loadFixture(deployProvenanceFixture);

      await provenance.connect(producer).registerProduct(productId, productName, metadataHash);

      const product = await provenance.getProductDetails(productId);
      
      // All data should match exactly
      expect(product.productId).to.equal(productId);
      expect(product.name).to.equal(productName);
      expect(product.metadataHash).to.equal(metadataHash);
      expect(product.currentOwner).to.equal(producer.address);
    });
  });
});

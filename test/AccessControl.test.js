import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("PharmaTraceAccessControl", function () {
  // Fixture to deploy the contract
  async function deployAccessControlFixture() {
    const [owner, producer, supplier, retailer, regulator, unauthorizedUser] = 
      await ethers.getSigners();

    const AccessControl = await ethers.getContractFactory("PharmaTraceAccessControl");
    const accessControl = await AccessControl.deploy();

    return { 
      accessControl, 
      owner, 
      producer, 
      supplier, 
      retailer, 
      regulator, 
      unauthorizedUser 
    };
  }

  describe("Deployment", function () {
    it("Should set the deployer as DEFAULT_ADMIN_ROLE", async function () {
      const { accessControl, owner } = await loadFixture(deployAccessControlFixture);
      
      const DEFAULT_ADMIN_ROLE = await accessControl.DEFAULT_ADMIN_ROLE();
      expect(await accessControl.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should correctly define all role constants", async function () {
      const { accessControl } = await loadFixture(deployAccessControlFixture);
      
      // Check that role constants are properly set
      expect(await accessControl.PRODUCER_ROLE()).to.equal(
        ethers.keccak256(ethers.toUtf8Bytes("PRODUCER_ROLE"))
      );
      expect(await accessControl.SUPPLIER_ROLE()).to.equal(
        ethers.keccak256(ethers.toUtf8Bytes("SUPPLIER_ROLE"))
      );
      expect(await accessControl.RETAILER_ROLE()).to.equal(
        ethers.keccak256(ethers.toUtf8Bytes("RETAILER_ROLE"))
      );
      expect(await accessControl.REGULATOR_ROLE()).to.equal(
        ethers.keccak256(ethers.toUtf8Bytes("REGULATOR_ROLE"))
      );
    });
  });

  describe("Role Granting", function () {
    it("Should allow admin to grant PRODUCER_ROLE", async function () {
      const { accessControl, owner, producer } = await loadFixture(deployAccessControlFixture);
      
      await accessControl.connect(owner).grantProducerRole(producer.address);
      
      const PRODUCER_ROLE = await accessControl.PRODUCER_ROLE();
      expect(await accessControl.hasRole(PRODUCER_ROLE, producer.address)).to.be.true;
    });

    it("Should allow admin to grant SUPPLIER_ROLE", async function () {
      const { accessControl, owner, supplier } = await loadFixture(deployAccessControlFixture);
      
      await accessControl.connect(owner).grantSupplierRole(supplier.address);
      
      const SUPPLIER_ROLE = await accessControl.SUPPLIER_ROLE();
      expect(await accessControl.hasRole(SUPPLIER_ROLE, supplier.address)).to.be.true;
    });

    it("Should allow admin to grant RETAILER_ROLE", async function () {
      const { accessControl, owner, retailer } = await loadFixture(deployAccessControlFixture);
      
      await accessControl.connect(owner).grantRetailerRole(retailer.address);
      
      const RETAILER_ROLE = await accessControl.RETAILER_ROLE();
      expect(await accessControl.hasRole(RETAILER_ROLE, retailer.address)).to.be.true;
    });

    it("Should allow admin to grant REGULATOR_ROLE", async function () {
      const { accessControl, owner, regulator } = await loadFixture(deployAccessControlFixture);
      
      await accessControl.connect(owner).grantRegulatorRole(regulator.address);
      
      const REGULATOR_ROLE = await accessControl.REGULATOR_ROLE();
      expect(await accessControl.hasRole(REGULATOR_ROLE, regulator.address)).to.be.true;
    });

    it("Should revert if non-admin tries to grant roles", async function () {
      const { accessControl, unauthorizedUser, producer } = await loadFixture(deployAccessControlFixture);
      
      await expect(
        accessControl.connect(unauthorizedUser).grantProducerRole(producer.address)
      ).to.be.reverted;
    });
  });

  describe("Role Revocation", function () {
    it("Should allow admin to revoke roles", async function () {
      const { accessControl, owner, producer } = await loadFixture(deployAccessControlFixture);
      
      // First grant the role
      const PRODUCER_ROLE = await accessControl.PRODUCER_ROLE();
      await accessControl.connect(owner).grantProducerRole(producer.address);
      expect(await accessControl.hasRole(PRODUCER_ROLE, producer.address)).to.be.true;
      
      // Then revoke it
      await accessControl.connect(owner).revokeStakeholderRole(PRODUCER_ROLE, producer.address);
      expect(await accessControl.hasRole(PRODUCER_ROLE, producer.address)).to.be.false;
    });

    it("Should revert if non-admin tries to revoke roles", async function () {
      const { accessControl, owner, unauthorizedUser, producer } = await loadFixture(deployAccessControlFixture);
      
      const PRODUCER_ROLE = await accessControl.PRODUCER_ROLE();
      await accessControl.connect(owner).grantProducerRole(producer.address);
      
      await expect(
        accessControl.connect(unauthorizedUser).revokeStakeholderRole(PRODUCER_ROLE, producer.address)
      ).to.be.reverted;
    });
  });

  describe("Role Checking", function () {
    it("Should correctly check if an address has a role", async function () {
      const { accessControl, owner, producer } = await loadFixture(deployAccessControlFixture);
      
      const PRODUCER_ROLE = await accessControl.PRODUCER_ROLE();
      
      // Before granting
      expect(await accessControl.checkRole(PRODUCER_ROLE, producer.address)).to.be.false;
      
      // After granting
      await accessControl.connect(owner).grantProducerRole(producer.address);
      expect(await accessControl.checkRole(PRODUCER_ROLE, producer.address)).to.be.true;
    });

    it("Should allow anyone to check roles", async function () {
      const { accessControl, owner, producer, unauthorizedUser } = await loadFixture(deployAccessControlFixture);
      
      const PRODUCER_ROLE = await accessControl.PRODUCER_ROLE();
      await accessControl.connect(owner).grantProducerRole(producer.address);
      
      // Unauthorized user can check roles (it's a view function)
      expect(
        await accessControl.connect(unauthorizedUser).checkRole(PRODUCER_ROLE, producer.address)
      ).to.be.true;
    });
  });

  describe("Multiple Roles", function () {
    it("Should allow an address to have multiple roles", async function () {
      const { accessControl, owner, producer } = await loadFixture(deployAccessControlFixture);
      
      await accessControl.connect(owner).grantProducerRole(producer.address);
      await accessControl.connect(owner).grantSupplierRole(producer.address);
      
      const PRODUCER_ROLE = await accessControl.PRODUCER_ROLE();
      const SUPPLIER_ROLE = await accessControl.SUPPLIER_ROLE();
      
      expect(await accessControl.hasRole(PRODUCER_ROLE, producer.address)).to.be.true;
      expect(await accessControl.hasRole(SUPPLIER_ROLE, producer.address)).to.be.true;
    });
  });
});

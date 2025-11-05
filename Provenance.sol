// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControl.sol";

/**
 * @title Provenance
 * @author PharmaTrace Team (CSE540)
 * @notice This contract manages the core supply chain lifecycle for pharmaceutical products.
 * It inherits from PharmaTraceAccessControl to enforce stakeholder permissions.
 *
 * This is a DRAFT contract for the CSE540 project.
 * It outlines the intended structure, state variables, events, and function signatures.
 * The logic within the functions is not yet implemented.
 */
contract Provenance is PharmaTraceAccessControl {

    // --- State ---

    /**
     * @dev Defines the possible states a product can be in during its lifecycle.
     */
    enum ProductStatus {
        Created,       // Registered by Producer
        Shipped,       // Shipped by Producer or Supplier
        InTransit,     // Actively in transit
        Received,      // Received by Supplier or Retailer
        InStock,       // Stored by Retailer
        Sold,          // Sold to consumer
        Flagged        // e.g., temperature anomaly, counterfeit suspicion
    }

    /**
     * @dev Represents a single batch or unit of a pharmaceutical product.
     */
    struct Product {
        bytes32 productId;         // Unique ID for the product (e.g., hash of batch number)
        string name;               // Product's common name
        address currentOwner;      // Address of the stakeholder currently holding the product
        ProductStatus status;      // Current status from the ProductStatus enum
        string metadataHash;       // IPFS hash pointing to off-chain data (certificates, temp logs)
        uint256 lastUpdateTime;    // Timestamp of the last update
    }

    /**
     * @dev A simple struct to log the history of a product.
     */
    struct HistoryEvent {
        address actor;             // Who performed the action
        ProductStatus newStatus;   // The status that was set
        uint256 timestamp;         // When it happened
    }

    // --- Mappings ---

    // Maps a unique product ID to its current Product struct
    mapping(bytes32 => Product) public products;

    // Maps a product ID to its full traceable history
    mapping(bytes32 => HistoryEvent[]) public productHistory;

    // --- Events ---

    /**
     * @notice Emitted when a new product is registered by a Producer.
     * @param productId The unique ID of the product
     * @param producer The address of the producer
     * @param name The product's name
     */
    event ProductRegistered(
        bytes32 indexed productId,
        address indexed producer,
        string name
    );

    /**
     * @notice Emitted when a product's custody is transferred.
     * @param productId The unique ID of the product
     * @param from The address of the previous owner
     * @param to The address of the new owner
     */
    event OwnershipTransferred(
        bytes32 indexed productId,
        address indexed from,
        address indexed to
    );

    /**
     * @notice Emitted when a product's status is updated (e.g., Shipped, Received).
     * @param productId The unique ID of the product
     * @param newStatus The new status of the product
     * @param actor The address of the stakeholder making the update
     */
    event StatusUpdated(
        bytes32 indexed productId,
        ProductStatus newStatus,
        address indexed actor
    );

    // --- Constructor ---

    /**
     * @dev The constructor for Provenance is empty.
     * The parent PharmaTraceAccessControl constructor is called automatically,
     * setting the deployer as the DEFAULT_ADMIN_ROLE.
     */
    constructor() {}

    // --- Core Functions (Signatures) ---

    /**
     * @notice Registers a new pharmaceutical product on the blockchain.
     * @dev Can only be called by an address with the PRODUCER_ROLE.
     * @param _productId A unique ID for the new product batch
     * @param _name The common name of the product
     * @param _metadataHash An IPFS hash pointing to off-chain data
     */
    function registerProduct(
        bytes32 _productId,
        string calldata _name,
        string calldata _metadataHash
    ) public onlyRole(PRODUCER_ROLE) {
        // --- FUNCTIONALITY TO BE IMPLEMENTED ---
        // 1. Check if productId already exists (require(products[...].lastUpdateTime == 0))
        // 2. Create a new Product struct
        // 3. Set msg.sender as currentOwner
        // 4. Set status to ProductStatus.Created
        // 5. Store the struct in the `products` mapping
        // 6. Add a "Created" event to `productHistory`
        // 7. Emit a ProductRegistered event
        revert("Provenance: Function not yet implemented.");
    }

    /**
     * @notice Transfers custody of a product from one stakeholder to another.
     * @dev Can only be called by the currentOwner of the product.
     * @param _productId The ID of the product to transfer
     * @param _newOwner The address of the new stakeholder (e.g., a Supplier or Retailer)
     * @param _newStatus The status to set upon transfer (e.g., Shipped)
     */
    function transferProduct(
        bytes32 _productId,
        address _newOwner,
        ProductStatus _newStatus
    ) public {
        // --- FUNCTIONALITY TO BE IMPLEMENTED ---
        // 1. Get the product from the `products` mapping
        // 2. Check if it exists (require(product.lastUpdateTime != 0))
        // 3. Check if msg.sender is the currentOwner (require(product.currentOwner == msg.sender))
        // 4. Update product.currentOwner to _newOwner
        // 5. Update product.status to _newStatus
        // 6. Update product.lastUpdateTime
        // 7. Add a HistoryEvent to `productHistory`
        // 8. Emit an OwnershipTransferred event
        // 9. Emit a StatusUpdated event
        revert("Provenance: Function not yet implemented.");
    }

    /**
     * @notice Updates the status of a product without changing ownership.
     * @dev Example: A Supplier receives a product (Received) and later puts
     * it on a truck (InTransit).
     * @dev Can only be called by the currentOwner of the product.
     * @param _productId The ID of the product to update
     * @param _newStatus The new status to set (e.g., InTransit, Received, Flagged)
     */
    function updateProductStatus(
        bytes32 _productId,
        ProductStatus _newStatus
    ) public {
        // --- FUNCTIONALITY TO BE IMPLEMENTED ---
        // 1. Get the product from the `products` mapping
        // 2. Check if it exists
        // 3. Check if msg.sender is the currentOwner
        // 4. Update product.status to _newStatus
        // 5. Update product.lastUpdateTime
        // 6. Add a HistoryEvent to `productHistory`
        // 7. Emit a StatusUpdated event
        revert("Provenance: Function not yet implemented.");
    }

    // --- View Functions (Signatures) ---

    /**
     * @notice Retrieves the current details of a specific product.
     * @param _productId The ID of the product
     * @return Product The full Product struct
     */
    function getProductDetails(
        bytes32 _productId
    ) public view returns (Product memory) {
        // --- FUNCTIONALITY TO BE IMPLEMENTED ---
        // 1. Return products[_productId]
        revert("Provenance: Function not yet implemented.");
    }

    /**
     * @notice Retrieves the full ownership and status history for a product.
     * @param _productId The ID of the product
     * @return HistoryEvent[] An array of all history events
     */
    function getProductHistory(
        bytes32 _productId
    ) public view returns (HistoryEvent[] memory) {
        // --- FUNCTIONALITY TO BE IMPLEMENTED ---
        // 1. Return productHistory[_productId]
        revert("Provenance: Function not yet implemented.");
    }

    /**
     * @notice A view function for Regulators (or any approved role) to
     * check a product's status.
     * @dev This demonstrates how a role can be used for read-only access.
     * @param _productId The ID of the product to check.
     */
    function regulatorCheckProduct(
        bytes32 _productId
    ) public view onlyRole(REGULATOR_ROLE) returns (Product memory) {
        // --- FUNCTIONALITY TO BE IMPLEMENTED ---
        // 1. Return products[_productId]
        revert("Provenance: Function not yet implemented.");
    }
}

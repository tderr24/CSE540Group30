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

    // --- Custom Errors ---

    error ProductAlreadyExists(bytes32 productId);
    error ProductDoesNotExist(bytes32 productId);
    error NotProductOwner(address caller, address owner);
    error InvalidProductId();
    error EmptyProductName();
    error EmptyMetadataHash();
    error InvalidNewOwner();
    error InvalidStatusTransition(ProductStatus current, ProductStatus newStatus);

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
        // Validate input parameters
        if (_productId == bytes32(0)) revert InvalidProductId();
        if (bytes(_name).length == 0) revert EmptyProductName();
        if (bytes(_metadataHash).length == 0) revert EmptyMetadataHash();
        
        // Check if product already exists
        if (products[_productId].lastUpdateTime != 0) {
            revert ProductAlreadyExists(_productId);
        }

        // Create new product
        Product memory newProduct = Product({
            productId: _productId,
            name: _name,
            currentOwner: msg.sender,
            status: ProductStatus.Created,
            metadataHash: _metadataHash,
            lastUpdateTime: block.timestamp
        });

        // Store product in mapping
        products[_productId] = newProduct;

        // Add initial history event
        productHistory[_productId].push(HistoryEvent({
            actor: msg.sender,
            newStatus: ProductStatus.Created,
            timestamp: block.timestamp
        }));

        // Emit event
        emit ProductRegistered(_productId, msg.sender, _name);
        emit StatusUpdated(_productId, ProductStatus.Created, msg.sender);
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
        // Validate new owner address
        if (_newOwner == address(0)) revert InvalidNewOwner();
        
        // Get the product
        Product storage product = products[_productId];
        
        // Check if product exists
        if (product.lastUpdateTime == 0) {
            revert ProductDoesNotExist(_productId);
        }
        
        // Check if msg.sender is the current owner
        if (product.currentOwner != msg.sender) {
            revert NotProductOwner(msg.sender, product.currentOwner);
        }

        // Store old owner for event
        address oldOwner = product.currentOwner;
        
        // Update product ownership and status
        product.currentOwner = _newOwner;
        product.status = _newStatus;
        product.lastUpdateTime = block.timestamp;

        // Add history event
        productHistory[_productId].push(HistoryEvent({
            actor: msg.sender,
            newStatus: _newStatus,
            timestamp: block.timestamp
        }));

        // Emit events
        emit OwnershipTransferred(_productId, oldOwner, _newOwner);
        emit StatusUpdated(_productId, _newStatus, msg.sender);
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
        // Get the product
        Product storage product = products[_productId];
        
        // Check if product exists
        if (product.lastUpdateTime == 0) {
            revert ProductDoesNotExist(_productId);
        }
        
        // Check if msg.sender is the current owner
        if (product.currentOwner != msg.sender) {
            revert NotProductOwner(msg.sender, product.currentOwner);
        }

        // Update product status
        product.status = _newStatus;
        product.lastUpdateTime = block.timestamp;

        // Add history event
        productHistory[_productId].push(HistoryEvent({
            actor: msg.sender,
            newStatus: _newStatus,
            timestamp: block.timestamp
        }));

        // Emit event
        emit StatusUpdated(_productId, _newStatus, msg.sender);
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
        Product memory product = products[_productId];
        
        // Check if product exists
        if (product.lastUpdateTime == 0) {
            revert ProductDoesNotExist(_productId);
        }
        
        return product;
    }

    /**
     * @notice Retrieves the full ownership and status history for a product.
     * @param _productId The ID of the product
     * @return HistoryEvent[] An array of all history events
     */
    function getProductHistory(
        bytes32 _productId
    ) public view returns (HistoryEvent[] memory) {
        // Check if product exists
        if (products[_productId].lastUpdateTime == 0) {
            revert ProductDoesNotExist(_productId);
        }
        
        return productHistory[_productId];
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
        Product memory product = products[_productId];
        
        // Check if product exists
        if (product.lastUpdateTime == 0) {
            revert ProductDoesNotExist(_productId);
        }
        
        return product;
    }
}

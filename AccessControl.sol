// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title PharmaTraceAccessControl
 * @author PharmaTrace Team (CSE540)
 * @notice This contract manages Role-Based Access Control (RBAC) for the PharmaTrace system.
 * It defines the roles for Producer, Supplier, Retailer, and Regulator.
 *
 * This contract is intended to be inherited by the main Provenance.sol contract.
 */
contract PharmaTraceAccessControl is AccessControl {

    // --- Roles ---
    // We define bytes32 constants for our stakeholder roles.
    bytes32 public constant PRODUCER_ROLE = keccak26("PRODUCER_ROLE");
    bytes32 public constant SUPPLIER_ROLE = keccak26("SUPPLIER_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak26("RETAILER_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak26("REGULATOR_ROLE");
    // The DEFAULT_ADMIN_ROLE (from AccessControl) will be the contract deployer
    // and will be responsible for granting these roles.

    // --- Constructor ---

    /**
     * @dev Sets up the contract deployer as the DEFAULT_ADMIN_ROLE.
     * This admin is responsible for granting the PRODUCER, SUPPLIER,
     * RETAILER, and REGULATOR roles to other stakeholder addresses.
     */
    constructor() {
        // _grantRole(role, address)
        // The deployer gets the admin role by default.
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // --- Admin Functions ---

    /**
     * @notice Grants the PRODUCER_ROLE to a given address.
     * @dev Can only be called by an admin.
     * @param _account The address to grant the role to.
     */
    function grantProducerRole(address _account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(PRODUCER_ROLE, _account);
    }

    /**
     * @notice Grants the SUPPLIER_ROLE to a given address.
     * @dev Can only be called by an admin.
     * @param _account The address to grant the role to.
     */
    function grantSupplierRole(address _account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(SUPPLIER_ROLE, _account);
    }

    /**
     * @notice Grants the RETAILER_ROLE to a given address.
     * @dev Can only be called by an admin.
     * @param _account The address to grant the role to.
     */
    function grantRetailerRole(address _account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(RETAILER_ROLE, _account);
    }

    /**
     * @notice Grants the REGULATOR_ROLE to a given address.
     * @dev Can only be called by an admin.
     * @param _account The address to grant the role to.
     */
    function grantRegulatorRole(address _account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(REGULATOR_ROLE, _account);
    }

    /**
     * @notice Revokes a specific role from a given address.
     * @dev Can only be called by an admin.
     * @param _role The role to revoke.
     * @param _account The address to revoke the role from.
     */
    function revokeStakeholderRole(bytes32 _role, address _account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(_role, _account);
    }

    // --- View Functions ---

    /**
     * @notice Checks if an address has a specific role.
     * @param _role The role to check.
     * @param _account The address to check.
     * @return bool True if the account has the role, false otherwise.
     */
    function checkRole(bytes32 _role, address _account) public view returns (bool) {
        return hasRole(_role, _account);
    }
}

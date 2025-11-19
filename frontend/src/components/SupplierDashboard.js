import React from 'react';

const SupplierDashboard = ({ contract, account }) => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>🚚 Supplier Dashboard</h2>
        <p>Receive products from producers and deliver to retailers</p>
      </div>

      <div className="dashboard-section">
        <h3>📦 Received Products</h3>
        <div className="empty-state">
          <h3>No products received yet</h3>
          <p>Products transferred to you will appear here</p>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>🚚 Update Product Status</h3>
        <p style={{ color: '#6b7280' }}>
          Use the Product Verification section to search for a product ID and update its status.
        </p>
      </div>
    </div>
  );
};

export default SupplierDashboard;

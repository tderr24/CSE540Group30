import React from 'react';

const RetailerDashboard = ({ contract, account }) => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>🏪 Retailer Dashboard</h2>
        <p>Manage inventory and sell products to consumers</p>
      </div>

      <div className="dashboard-section">
        <h3>📦 Inventory</h3>
        <div className="empty-state">
          <h3>No products in stock</h3>
          <p>Products delivered to you will appear here</p>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>💰 Sell Product</h3>
        <p style={{ color: '#6b7280' }}>
          Use the Product Verification section to search for a product and transfer it to a consumer.
        </p>
      </div>
    </div>
  );
};

export default RetailerDashboard;

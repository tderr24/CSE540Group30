import React from 'react';

const ConsumerDashboard = ({ contract, account }) => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>👤 Consumer Dashboard</h2>
        <p>View your purchased pharmaceutical products</p>
      </div>

      <div className="dashboard-section">
        <h3>💊 My Products</h3>
        <div className="empty-state">
          <h3>No products purchased yet</h3>
          <p>Products you purchase will appear here with their complete history</p>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>🔍 Verify Product Authenticity</h3>
        <p style={{ color: '#6b7280' }}>
          Use the Product Verification section below to check any product's complete journey from manufacturer to you.
        </p>
      </div>
    </div>
  );
};

export default ConsumerDashboard;

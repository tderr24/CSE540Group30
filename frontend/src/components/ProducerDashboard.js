import React, { useState } from 'react';
import { ethers } from 'ethers';
import { getStatusName, getStatusColor } from '../utils/web3';

const ProducerDashboard = ({ contract, account }) => {
  const [productName, setProductName] = useState('');
  const [metadataHash, setMetadataHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleRegisterProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Generate unique product ID
      const batchNumber = `BATCH-${Date.now()}`;
      const productId = ethers.keccak256(ethers.toUtf8Bytes(batchNumber));

      const tx = await contract.registerProduct(productId, productName, metadataHash);
      await tx.wait();

      setSuccess(`Product registered! Batch: ${batchNumber}`);
      setProductName('');
      setMetadataHash('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>🏭 Producer Dashboard</h2>
        <p>Register new pharmaceutical products and manage shipments</p>
      </div>

      <div className="dashboard-section">
        <h3>📦 Register New Product</h3>
        <form onSubmit={handleRegisterProduct}>
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., COVID-19 Vaccine - Pfizer"
              required
            />
          </div>

          <div className="form-group">
            <label>IPFS Metadata Hash</label>
            <input
              type="text"
              value={metadataHash}
              onChange={(e) => setMetadataHash(e.target.value)}
              placeholder="e.g., QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
              required
            />
            <small style={{ color: '#6b7280' }}>
              Contains manufacturing certificates, batch info, temperature requirements
            </small>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : '✅ Register Product'}
          </button>
        </form>

        {success && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#d1fae5', borderRadius: '6px', color: '#065f46' }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#fee2e2', borderRadius: '6px', color: '#991b1b' }}>
            {error}
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h3>📋 Your Products</h3>
        <p style={{ color: '#6b7280' }}>
          Products you've created will appear here. Use the Product Verification section to view details.
        </p>
      </div>
    </div>
  );
};

export default ProducerDashboard;

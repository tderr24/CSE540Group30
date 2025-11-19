import React, { useState } from 'react';
import { ethers } from 'ethers';
import { formatAddress, getStatusName, getStatusColor } from '../utils/web3';

const ProductVerification = ({ contract }) => {
  const [productId, setProductId] = useState('');
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!contract) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');
    setProduct(null);
    setHistory([]);

    try {
      // Get product details
      const productData = await contract.getProductDetails(productId);
      setProduct({
        productId: productData.productId,
        name: productData.name,
        currentOwner: productData.currentOwner,
        status: Number(productData.status),
        metadataHash: productData.metadataHash,
        lastUpdateTime: Number(productData.lastUpdateTime)
      });

      // Get product history
      const historyData = await contract.getProductHistory(productId);
      setHistory(historyData.map(event => ({
        actor: event.actor,
        status: Number(event.newStatus),
        timestamp: Number(event.timestamp)
      })));
    } catch (err) {
      setError('Product not found or error fetching data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTestId = () => {
    const testId = ethers.keccak256(ethers.toUtf8Bytes('BATCH-2025-001'));
    setProductId(testId);
  };

  return (
    <div className="dashboard" style={{ marginTop: '2rem' }}>
      <div className="dashboard-header">
        <h2>🔍 Product Verification Portal</h2>
        <p>Search for any product by ID to view its complete journey</p>
      </div>

      <form onSubmit={handleSearch}>
        <div className="form-group">
          <label>Product ID (Hash)</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="0x..."
              style={{ flex: 1 }}
            />
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleGenerateTestId}
            >
              Use Test ID
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !contract}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '6px', color: '#991b1b', marginTop: '1rem' }}>
          {error}
        </div>
      )}

      {product && (
        <div style={{ marginTop: '2rem' }}>
          <div className="product-card" style={{ maxWidth: '600px' }}>
            <div className="product-header">
              <div>
                <div className="product-name">{product.name}</div>
                <div className="product-id">{product.productId}</div>
              </div>
              <span 
                className="status-badge" 
                style={{ backgroundColor: getStatusColor(product.status) }}
              >
                {getStatusName(product.status)}
              </span>
            </div>

            <div className="product-info">
              <div className="info-row">
                <span className="info-label">Current Owner</span>
                <span className="info-value">{formatAddress(product.currentOwner)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">IPFS Hash</span>
                <span className="info-value" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {product.metadataHash.substring(0, 20)}...
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Last Updated</span>
                <span className="info-value">
                  {new Date(product.lastUpdateTime * 1000).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {history.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3>📜 Product History ({history.length} events)</h3>
              <div style={{ marginTop: '1rem' }}>
                {history.map((event, index) => (
                  <div 
                    key={index}
                    style={{
                      padding: '1rem',
                      background: '#f9fafb',
                      borderLeft: `4px solid ${getStatusColor(event.status)}`,
                      marginBottom: '0.5rem',
                      borderRadius: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: getStatusColor(event.status) }}>
                          {getStatusName(event.status)}
                        </strong>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          By: {formatAddress(event.actor)}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {new Date(event.timestamp * 1000).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductVerification;

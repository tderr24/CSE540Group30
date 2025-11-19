import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { formatAddress, formatProductId, getStatusColor, getStatusName } from '../utils/web3';
import { useAccountProducts } from '../hooks/useProducts';

const RETAILER_STATUS_OPTIONS = [
  { value: 4, label: 'In Stock (internal transfer)' },
  { value: 5, label: 'Sold to Consumer' }
];

const RetailerDashboard = ({ contract, account }) => {
  const { products, loading, error, refresh } = useAccountProducts(contract, account);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [statusCode, setStatusCode] = useState(RETAILER_STATUS_OPTIONS[1].value);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMessage, setTransferMessage] = useState({ type: null, text: '' });

  useEffect(() => {
    if (products.length === 0) {
      setSelectedProductId('');
      return;
    }
    const exists = products.find((p) => p.productId === selectedProductId);
    if (!exists) {
      setSelectedProductId(products[0].productId);
    }
  }, [products, selectedProductId]);

  const handleTransfer = async (event) => {
    event.preventDefault();
    if (!contract) return;

    if (!selectedProductId) {
      setTransferMessage({ type: 'error', text: 'Select a product to transfer.' });
      return;
    }

    if (!recipient || !ethers.isAddress(recipient)) {
      setTransferMessage({ type: 'error', text: 'Enter a valid consumer wallet address.' });
      return;
    }

    setTransferLoading(true);
    setTransferMessage({ type: null, text: '' });

    try {
      const tx = await contract.transferProduct(selectedProductId, recipient.trim(), Number(statusCode));
      await tx.wait();
      setTransferMessage({ type: 'success', text: `Product delivered to ${formatAddress(recipient.trim())}` });
      setRecipient('');
      await refresh();
    } catch (err) {
      console.error('Retailer transfer failed', err);
      setTransferMessage({ type: 'error', text: err?.shortMessage || err?.message || 'Transfer failed' });
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>🏪 Retailer Dashboard</h2>
        <p>Manage inventory and sell products to consumers</p>
      </div>

      <div className="dashboard-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <h3>📦 Inventory</h3>
          <button className="btn btn-secondary" onClick={refresh} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {error && (
          <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '6px', background: '#fee2e2', color: '#991b1b' }}>
            {error}
          </div>
        )}
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {products.length === 0 && !loading && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <h3>No products in stock</h3>
              <p>Shipments from suppliers will appear once your wallet receives custody.</p>
            </div>
          )}

          {products.map((product) => (
            <button
              key={product.productId}
              onClick={() => setSelectedProductId(product.productId)}
              style={{
                textAlign: 'left',
                border: selectedProductId === product.productId ? '2px solid #22c55e' : '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{product.name || 'Unnamed Product'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{formatProductId(product.productId)}</div>
                </div>
                <span className="status-badge" style={{ backgroundColor: getStatusColor(product.status) }}>
                  {getStatusName(product.status)}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                Owner: {formatAddress(product.currentOwner)}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-section">
        <h3>💰 Sell or Transfer</h3>
        <p style={{ color: '#6b7280' }}>
          Send the selected product to your consumer's wallet address or move it to another retailer account.
        </p>
        <form onSubmit={handleTransfer} style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label>Product</label>
            <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
              <option value="">Select a product</option>
              {products.map((product) => (
                <option key={product.productId} value={product.productId}>
                  {product.name || 'Unnamed'} ({formatProductId(product.productId)})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Consumer Wallet</label>
            <input
              type="text"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Status for Transfer</label>
            <select value={statusCode} onChange={(e) => setStatusCode(Number(e.target.value))}>
              {RETAILER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" disabled={transferLoading || products.length === 0}>
            {transferLoading ? 'Transferring...' : 'Send to Consumer'}
          </button>
        </form>
        {transferMessage.text && (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '6px',
              background: transferMessage.type === 'success' ? '#d1fae5' : '#fee2e2',
              color: transferMessage.type === 'success' ? '#065f46' : '#991b1b'
            }}
          >
            {transferMessage.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default RetailerDashboard;

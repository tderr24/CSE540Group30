import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { formatAddress, formatProductId, getStatusName, getStatusColor } from '../utils/web3';
import { useAccountProducts } from '../hooks/useProducts';

const PRODUCER_STATUS_OPTIONS = [
  { value: 1, label: 'Shipped (handoff to Supplier)' },
  { value: 2, label: 'In Transit' }
];

const ProducerDashboard = ({ contract, account }) => {
  const [productName, setProductName] = useState('');
  const [metadataHash, setMetadataHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { products, loading: inventoryLoading, error: inventoryError, refresh: refreshInventory } =
    useAccountProducts(contract, account);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [transferStatus, setTransferStatus] = useState(PRODUCER_STATUS_OPTIONS[0].value);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferMessage, setTransferMessage] = useState({ type: null, text: '' });

  useEffect(() => {
    if (products.length === 0) {
      setSelectedProductId('');
      return;
    }
    const stillExists = products.find((p) => p.productId === selectedProductId);
    if (!stillExists) {
      setSelectedProductId(products[0].productId);
    }
  }, [products, selectedProductId]);

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
      await refreshInventory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (event) => {
    event.preventDefault();
    if (!contract) return;

    if (!selectedProductId) {
      setTransferMessage({ type: 'error', text: 'Select a product to transfer.' });
      return;
    }

    if (!transferAddress || !ethers.isAddress(transferAddress)) {
      setTransferMessage({ type: 'error', text: 'Enter a valid recipient wallet address (0x...).' });
      return;
    }

    setTransferLoading(true);
    setTransferMessage({ type: null, text: '' });

    try {
      const tx = await contract.transferProduct(
        selectedProductId,
        transferAddress.trim(),
        Number(transferStatus)
      );
      await tx.wait();
      setTransferMessage({
        type: 'success',
        text: `Product sent to ${formatAddress(transferAddress.trim())}`
      });
      setTransferAddress('');
      await refreshInventory();
    } catch (transferError) {
      console.error('Transfer failed', transferError);
      setTransferMessage({
        type: 'error',
        text: transferError?.shortMessage || transferError?.message || 'Transfer failed'
      });
    } finally {
      setTransferLoading(false);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <h3>📋 My Inventory</h3>
          <button className="btn btn-secondary" onClick={refreshInventory} disabled={inventoryLoading}>
            {inventoryLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {inventoryError && (
          <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '6px', background: '#fee2e2', color: '#991b1b' }}>
            {inventoryError}
          </div>
        )}
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {products.length === 0 && !inventoryLoading && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <h3>No products in inventory</h3>
              <p>Registered batches that stay with you will show up here.</p>
            </div>
          )}

          {products.map((product) => (
            <button
              key={product.productId}
              className="product-card"
              onClick={() => setSelectedProductId(product.productId)}
              style={{
                textAlign: 'left',
                border: selectedProductId === product.productId ? '2px solid #6366f1' : '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div>
                  <div className="product-name" style={{ fontSize: '1rem' }}>{product.name || 'Unnamed Product'}</div>
                  <div className="product-id" style={{ fontSize: '0.8rem' }}>{formatProductId(product.productId)}</div>
                </div>
                <span className="status-badge" style={{ backgroundColor: getStatusColor(product.status) }}>
                  {getStatusName(product.status)}
                </span>
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                Updated {new Date(product.lastUpdateTime * 1000).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-section">
        <h3>🚚 Transfer Product</h3>
        <p style={{ color: '#6b7280' }}>
          Select a product you own and hand it off to the supplier address. Each transfer records a new status on-chain.
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
            <label>Recipient Address (Supplier)</label>
            <input
              type="text"
              placeholder="0x..."
              value={transferAddress}
              onChange={(e) => setTransferAddress(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Status for Transfer</label>
            <select value={transferStatus} onChange={(e) => setTransferStatus(Number(e.target.value))}>
              {PRODUCER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" disabled={transferLoading || products.length === 0}>
            {transferLoading ? 'Sending...' : 'Send to Supplier'}
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

export default ProducerDashboard;

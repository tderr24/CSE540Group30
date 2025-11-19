import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { formatAddress, formatProductId, getStatusColor, getStatusName } from '../utils/web3';

const ROLE_OPTIONS = [
  { key: 'PRODUCER', label: '🏭 Producer', grantMethod: 'grantProducerRole', getter: 'PRODUCER_ROLE' },
  { key: 'SUPPLIER', label: '🚚 Supplier', grantMethod: 'grantSupplierRole', getter: 'SUPPLIER_ROLE' },
  { key: 'RETAILER', label: '🏪 Retailer', grantMethod: 'grantRetailerRole', getter: 'RETAILER_ROLE' },
  { key: 'CONSUMER', label: '👤 Consumer', grantMethod: 'grantConsumerRole', getter: 'CONSUMER_ROLE' },
  { key: 'REGULATOR', label: '🔍 Regulator', grantMethod: 'grantRegulatorRole', getter: 'REGULATOR_ROLE' }
];

const StatCard = ({ value = '-', label, color }) => (
  <div style={{ padding: '1.5rem', background: '#f9fafb', borderRadius: '8px' }}>
    <div style={{ fontSize: '2rem', fontWeight: '700', color }}>{value}</div>
    <div style={{ color: '#6b7280' }}>{label}</div>
  </div>
);

const FeedbackBanner = ({ state }) => {
  if (!state?.message) return null;
  const palette = state.type === 'success'
    ? { bg: '#d1fae5', color: '#065f46' }
    : { bg: '#fee2e2', color: '#991b1b' };

  return (
    <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '6px', background: palette.bg, color: palette.color }}>
      {state.message}
    </div>
  );
};

const RegulatorDashboard = ({ contract, account, isAdmin }) => {
  const [selectedRole, setSelectedRole] = useState(ROLE_OPTIONS[0].key);
  const [targetAddress, setTargetAddress] = useState('');
  const [grantState, setGrantState] = useState({ type: null, message: '' });
  const [grantLoading, setGrantLoading] = useState(false);

  const [revokeRole, setRevokeRole] = useState(ROLE_OPTIONS[0].key);
  const [revokeAddress, setRevokeAddress] = useState('');
  const [revokeState, setRevokeState] = useState({ type: null, message: '' });
  const [revokeLoading, setRevokeLoading] = useState(false);

  const [roleHashes, setRoleHashes] = useState({});
  const [roleHashError, setRoleHashError] = useState('');

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const selectedConfig = useMemo(() => ROLE_OPTIONS.find((role) => role.key === selectedRole), [selectedRole]);
  const revokeConfig = useMemo(() => ROLE_OPTIONS.find((role) => role.key === revokeRole), [revokeRole]);

  useEffect(() => {
    const fetchRoleHashes = async () => {
      if (!contract || !isAdmin) return;
      try {
        const entries = await Promise.all(
          ROLE_OPTIONS.map(async (role) => {
            const getter = contract[role.getter];
            if (typeof getter !== 'function') {
              throw new Error(`Contract is missing ${role.getter}()`);
            }
            const hash = await getter();
            return [role.key, hash];
          })
        );
        setRoleHashes(Object.fromEntries(entries));
        setRoleHashError('');
      } catch (error) {
        console.error('Failed to fetch role identifiers', error);
        setRoleHashError('Unable to load role identifiers. Revoke actions may fail until refreshed.');
      }
    };

    fetchRoleHashes();
  }, [contract, isAdmin]);

  const validateAddress = (address) => {
    if (!address || !ethers.isAddress(address)) {
      return 'Enter a valid Ethereum address (0x...).';
    }
    return '';
  };

  const handleSelectProduct = useCallback(async (productId) => {
    if (!contract) return;

    setSelectedProductId(productId);
    setHistory([]);
    setHistoryError('');
    setHistoryLoading(true);

    try {
      const details = await contract.getProductDetails(productId);
      const historyData = await contract.getProductHistory(productId);

      setSelectedProductDetails({
        productId: details.productId,
        name: details.name,
        currentOwner: details.currentOwner,
        status: Number(details.status),
        metadataHash: details.metadataHash,
        lastUpdateTime: Number(details.lastUpdateTime)
      });

      setHistory(historyData.map(event => ({
        actor: event.actor,
        status: Number(event.newStatus),
        timestamp: Number(event.timestamp)
      })));
    } catch (error) {
      console.error('Failed to load product history', error);
      setHistoryError(error?.shortMessage || error?.message || 'Unable to load product history.');
      setSelectedProductDetails(null);
    } finally {
      setHistoryLoading(false);
    }
  }, [contract]);

  const fetchProducts = useCallback(async () => {
    if (!contract || !isAdmin) return;

    setProductsLoading(true);
    setProductsError('');

    try {
      if (!contract.filters?.ProductRegistered) {
        throw new Error('Contract ABI missing ProductRegistered event definition.');
      }

      const filter = contract.filters.ProductRegistered();
      const events = await contract.queryFilter(filter, 0, 'latest');
      const latestEvents = new Map();

      events.forEach((event) => {
        const productId = event.args?.productId;
        if (productId) {
          latestEvents.set(productId, event);
        }
      });

      const summaries = [];
      for (const [productId, event] of latestEvents.entries()) {
        try {
          const details = await contract.getProductDetails(productId);
          summaries.push({
            productId: details.productId,
            name: details.name,
            currentOwner: details.currentOwner,
            status: Number(details.status),
            metadataHash: details.metadataHash,
            lastUpdateTime: Number(details.lastUpdateTime),
            registeredBy: event.args?.producer || event.args?.[1] || ''
          });
        } catch (detailError) {
          console.warn('Skipping product', productId, detailError);
        }
      }

      summaries.sort((a, b) => b.lastUpdateTime - a.lastUpdateTime);
      setProducts(summaries);

      if (summaries.length === 0) {
        setSelectedProductId(null);
        setSelectedProductDetails(null);
        setHistory([]);
      }
    } catch (error) {
      console.error('Failed to fetch products', error);
      setProductsError(error?.shortMessage || error?.message || 'Unable to load products from chain.');
    } finally {
      setProductsLoading(false);
    }
  }, [contract, isAdmin]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!contract || !isAdmin) return;
    const refreshHandler = () => fetchProducts();

    contract.on('ProductRegistered', refreshHandler);
    contract.on('StatusUpdated', refreshHandler);

    return () => {
      contract.off('ProductRegistered', refreshHandler);
      contract.off('StatusUpdated', refreshHandler);
    };
  }, [contract, fetchProducts, isAdmin]);

  useEffect(() => {
    if (!isAdmin || !products.length) return;
    if (!selectedProductId) {
      handleSelectProduct(products[0].productId);
    }
  }, [products, selectedProductId, isAdmin, handleSelectProduct]);

  const handleGrantRole = async (event) => {
    event.preventDefault();
    if (!contract || !selectedConfig) return;

    const validationError = validateAddress(targetAddress);
    if (validationError) {
      setGrantState({ type: 'error', message: validationError });
      return;
    }

    const method = contract[selectedConfig.grantMethod];
    if (typeof method !== 'function') {
      setGrantState({ type: 'error', message: `Contract does not expose ${selectedConfig.grantMethod}() yet.` });
      return;
    }

    setGrantLoading(true);
    setGrantState({ type: null, message: '' });

    try {
      const tx = await method(targetAddress.trim());
      await tx.wait();
      setGrantState({
        type: 'success',
        message: `${selectedConfig.label} role granted to ${formatAddress(targetAddress.trim())}`
      });
      setTargetAddress('');
    } catch (error) {
      console.error('Grant role failed', error);
      setGrantState({ type: 'error', message: error?.shortMessage || error?.message || 'Grant failed' });
    } finally {
      setGrantLoading(false);
    }
  };

  const handleRevokeRole = async (event) => {
    event.preventDefault();
    if (!contract || !revokeConfig) return;

    const validationError = validateAddress(revokeAddress);
    if (validationError) {
      setRevokeState({ type: 'error', message: validationError });
      return;
    }

    const roleHash = roleHashes[revokeRole];
    if (!roleHash) {
      setRevokeState({ type: 'error', message: 'Role identifiers not loaded yet. Please wait or refresh.' });
      return;
    }

    if (typeof contract.revokeStakeholderRole !== 'function') {
      setRevokeState({ type: 'error', message: 'Contract is missing revokeStakeholderRole().' });
      return;
    }

    setRevokeLoading(true);
    setRevokeState({ type: null, message: '' });

    try {
      const tx = await contract.revokeStakeholderRole(roleHash, revokeAddress.trim());
      await tx.wait();
      setRevokeState({
        type: 'success',
        message: `${revokeConfig.label} role revoked from ${formatAddress(revokeAddress.trim())}`
      });
      setRevokeAddress('');
    } catch (error) {
      console.error('Revoke role failed', error);
      setRevokeState({ type: 'error', message: error?.shortMessage || error?.message || 'Revoke failed' });
    } finally {
      setRevokeLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>🔍 {isAdmin ? 'Admin' : 'Regulator'} Dashboard</h2>
        <p>Audit and oversee the entire supply chain</p>
      </div>

      <div className="dashboard-section">
        <h3>📊 System Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <StatCard label="Total Products" color="#667eea" />
          <StatCard label="Active Shipments" color="#10b981" />
          <StatCard label="Flagged Products" color="#ef4444" />
        </div>
      </div>

      {isAdmin && (
        <div className="dashboard-section">
          <h3>⚙️ Admin Role Management</h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Grant or revoke stakeholder roles directly from the dApp. Actions require MetaMask confirmation and are recorded on-chain.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ marginBottom: '1rem' }}>➕ Grant Role</h4>
              <form onSubmit={handleGrantRole}>
                <div className="form-group">
                  <label>Role</label>
                  <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role.key} value={role.key}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Wallet Address</label>
                  <input
                    type="text"
                    placeholder="0xabc..."
                    value={targetAddress}
                    onChange={(e) => setTargetAddress(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={grantLoading}>
                  {grantLoading ? 'Granting...' : 'Grant Role'}
                </button>
              </form>
              <FeedbackBanner state={grantState} />
            </div>

            <div style={{ padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ marginBottom: '1rem' }}>➖ Revoke Role</h4>
              <form onSubmit={handleRevokeRole}>
                <div className="form-group">
                  <label>Role</label>
                  <select value={revokeRole} onChange={(e) => setRevokeRole(e.target.value)}>
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role.key} value={role.key}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Wallet Address</label>
                  <input
                    type="text"
                    placeholder="0xabc..."
                    value={revokeAddress}
                    onChange={(e) => setRevokeAddress(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-secondary" disabled={revokeLoading}>
                  {revokeLoading ? 'Revoking...' : 'Revoke Role'}
                </button>
              </form>
              <FeedbackBanner state={revokeState} />
              {roleHashError && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#b45309' }}>{roleHashError}</div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <h4>📘 Role Reference</h4>
            <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {ROLE_OPTIONS.map((role) => (
                <div key={role.key} style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>{role.label}</div>
                  <div style={{ wordBreak: 'break-all', color: '#6b7280' }}>{roleHashes[role.key] || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="dashboard-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div>
              <h3>🗂️ Product Explorer</h3>
              <p style={{ color: '#6b7280' }}>
                Browse every registered product and drill into its complete history in one place.
              </p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={fetchProducts}
              disabled={productsLoading}
              style={{ whiteSpace: 'nowrap' }}
            >
              {productsLoading ? 'Refreshing...' : 'Refresh List'}
            </button>
          </div>

          {productsError && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '6px', background: '#fee2e2', color: '#991b1b' }}>
              {productsError}
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) 2fr', gap: '1.5rem' }}>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', maxHeight: '480px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>Products ({products.length})</div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {productsLoading && products.length === 0 && (
                  <div style={{ padding: '1rem', color: '#6b7280' }}>Loading products...</div>
                )}

                {!productsLoading && products.length === 0 && (
                  <div className="empty-state" style={{ padding: '1.5rem' }}>
                    <h4>No products registered yet</h4>
                    <p>Producers can register batches from their dashboard to populate this list.</p>
                  </div>
                )}

                {products.map((product) => {
                  const isSelected = selectedProductId === product.productId;
                  return (
                    <button
                      key={product.productId}
                      onClick={() => handleSelectProduct(product.productId)}
                      style={{
                        width: '100%',
                        border: 'none',
                        borderBottom: '1px solid #e5e7eb',
                        background: isSelected ? '#eef2ff' : '#ffffff',
                        textAlign: 'left',
                        padding: '1rem',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{product.name || 'Unnamed Product'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{formatProductId(product.productId)}</div>
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                            Owner: {formatAddress(product.currentOwner)}
                          </div>
                        </div>
                        <span
                          style={{
                            height: 'fit-content',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            color: '#fff',
                            background: getStatusColor(product.status)
                          }}
                        >
                          {getStatusName(product.status)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                        Updated {new Date(product.lastUpdateTime * 1000).toLocaleString()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', minHeight: '320px' }}>
              {!selectedProductDetails && (
                <div style={{ color: '#6b7280' }}>
                  Select a product to view its on-chain metadata and history timeline.
                </div>
              )}

              {selectedProductDetails && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <h4 style={{ marginBottom: '0.25rem' }}>{selectedProductDetails.name}</h4>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#6b7280' }}>{selectedProductDetails.productId}</div>
                    </div>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(selectedProductDetails.status) }}
                    >
                      {getStatusName(selectedProductDetails.status)}
                    </span>
                  </div>

                  <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Current Owner</div>
                      <div style={{ fontWeight: 600 }}>{formatAddress(selectedProductDetails.currentOwner)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Last Updated</div>
                      <div style={{ fontWeight: 600 }}>{new Date(selectedProductDetails.lastUpdateTime * 1000).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>IPFS Hash</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                        {selectedProductDetails.metadataHash || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ marginBottom: '0.5rem' }}>📜 History Timeline</h4>
                    {historyError && (
                      <div style={{ padding: '0.75rem', borderRadius: '6px', background: '#fee2e2', color: '#991b1b', marginBottom: '0.75rem' }}>
                        {historyError}
                      </div>
                    )}
                    {historyLoading && (
                      <div style={{ color: '#6b7280' }}>Loading history...</div>
                    )}
                    {!historyLoading && history.length === 0 && !historyError && (
                      <div style={{ color: '#6b7280' }}>No history events recorded.</div>
                    )}
                    {!historyLoading && history.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {history.map((event, index) => (
                          <div
                            key={`${event.actor}-${event.timestamp}-${index}`}
                            style={{
                              padding: '0.75rem 1rem',
                              background: '#f9fafb',
                              borderLeft: `4px solid ${getStatusColor(event.status)}`,
                              borderRadius: '4px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <strong style={{ color: getStatusColor(event.status) }}>{getStatusName(event.status)}</strong>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
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
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-section">
        <h3>🔍 Audit Products</h3>
        <p style={{ color: '#6b7280' }}>
          Use the Product Verification section to audit any product in the system. 
          As a regulator, you have full visibility into all products.
        </p>
        {isAdmin && (
          <p style={{ color: '#4b5563', marginTop: '0.5rem' }}>
            Connected admin: <strong>{formatAddress(account)}</strong>
          </p>
        )}
      </div>
    </div>
  );
};

export default RegulatorDashboard;

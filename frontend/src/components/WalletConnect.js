import React from 'react';
import { formatAddress } from '../utils/web3';

const ROLE_LABELS = {
  PRODUCER: '🏭 Producer',
  SUPPLIER: '🚚 Supplier',
  RETAILER: '🏪 Retailer',
  CONSUMER: '👤 Consumer',
  REGULATOR: '🔍 Regulator',
  ADMIN: '⚙️ Admin'
};

const WalletConnect = ({ account, userRole, chainId, onConnect, onDisconnect, onSwitchAccount, loading }) => {
  if (!account) {
    return (
      <div>
        <button 
          className="btn btn-primary" 
          onClick={onConnect}
          disabled={loading}
        >
          {loading ? 'Connecting...' : '🔗 Connect Wallet'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#667eea' }}>
            {ROLE_LABELS[userRole] || '❓ Unknown'}
          </span>
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {formatAddress(account)}
        </div>
        {chainId && (
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            Chain ID: {chainId}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {typeof onSwitchAccount === 'function' && (
          <button
            className="btn btn-light"
            onClick={onSwitchAccount}
            style={{ padding: '0.5rem 1rem' }}
            disabled={loading}
          >
            Switch Account
          </button>
        )}
        <button 
          className="btn btn-secondary" 
          onClick={onDisconnect}
          style={{ padding: '0.5rem 1rem' }}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
};

export default WalletConnect;

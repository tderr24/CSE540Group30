import React, { useState, useEffect } from 'react';
import './App.css';
import { connectWallet, switchToConfiguredNetwork, getContract, formatAddress, getConfiguredChainId, getConfiguredNetworkName } from './utils/web3';
import WalletConnect from './components/WalletConnect';
import ProducerDashboard from './components/ProducerDashboard';
import SupplierDashboard from './components/SupplierDashboard';
import RetailerDashboard from './components/RetailerDashboard';
import ConsumerDashboard from './components/ConsumerDashboard';
import RegulatorDashboard from './components/RegulatorDashboard';
import ProductVerification from './components/ProductVerification';

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check user's role
  const checkUserRole = async (contractInstance, userAddress) => {
    try {
      const roles = {
        PRODUCER: await contractInstance.PRODUCER_ROLE(),
        SUPPLIER: await contractInstance.SUPPLIER_ROLE(),
        RETAILER: await contractInstance.RETAILER_ROLE(),
        CONSUMER: await contractInstance.CONSUMER_ROLE(),
        REGULATOR: await contractInstance.REGULATOR_ROLE(),
        ADMIN: await contractInstance.DEFAULT_ADMIN_ROLE()
      };

      for (const [roleName, roleHash] of Object.entries(roles)) {
        const hasRole = await contractInstance.hasRole(roleHash, userAddress);
        if (hasRole) {
          setUserRole(roleName);
          return;
        }
      }
      
      setUserRole(null); // No role assigned
    } catch (err) {
      console.error('Error checking role:', err);
      setUserRole(null);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { account: newAccount, provider: newProvider, signer: newSigner, chainId: newChainId } = 
        await connectWallet();
      
      const targetChainId = getConfiguredChainId();
      if (newChainId !== targetChainId) {
        await switchToConfiguredNetwork();
        const reconnected = await connectWallet();
        setAccount(reconnected.account);
        setProvider(reconnected.provider);
        setSigner(reconnected.signer);
        setChainId(reconnected.chainId);
        
        const contractInstance = await getContract(reconnected.signer);
        setContract(contractInstance);
        await checkUserRole(contractInstance, reconnected.account);
      } else {
        setAccount(newAccount);
        setProvider(newProvider);
        setSigner(newSigner);
        setChainId(newChainId);
        
        const contractInstance = await getContract(newSigner);
        setContract(contractInstance);
        await checkUserRole(contractInstance, newAccount);
      }
    } catch (err) {
      setError(err.message);
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setAccount(null);
    setContract(null);
    setProvider(null);
    setSigner(null);
    setUserRole(null);
  };

  const handleSwitchAccount = async () => {
    if (!window.ethereum) {
      setError('MetaMask is required to switch accounts.');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });
      await handleConnect();
    } catch (err) {
      console.error('Switch account error:', err);
      if (err?.code === 4001) {
        setError('Account switch request was rejected in MetaMask.');
      } else if (err?.message) {
        setError(err.message);
      }
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          handleConnect();
        } else {
          handleDisconnect();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  const renderDashboard = () => {
    if (!account || !contract) {
      return (
        <div className="welcome-section">
          <h2>🏥 Welcome to PharmaTrace</h2>
          <p>A blockchain-based pharmaceutical supply chain tracking system</p>
          <div className="features">
            <div className="feature">
              <h3>🔒 Secure</h3>
              <p>Immutable records on blockchain</p>
            </div>
            <div className="feature">
              <h3>👁️ Transparent</h3>
              <p>Complete visibility for all stakeholders</p>
            </div>
            <div className="feature">
              <h3>✅ Verified</h3>
              <p>Prevent counterfeit drugs</p>
            </div>
          </div>
        </div>
      );
    }

    if (!userRole) {
      return (
        <div className="no-role-section">
          <h2>⚠️ No Role Assigned</h2>
          <p>Your account ({formatAddress(account)}) does not have any role assigned on {getConfiguredNetworkName()}.</p>
          <p>Please contact the administrator to get a role assigned.</p>
        </div>
      );
    }

    switch (userRole) {
      case 'PRODUCER':
        return <ProducerDashboard contract={contract} account={account} />;
      case 'SUPPLIER':
        return <SupplierDashboard contract={contract} account={account} />;
      case 'RETAILER':
        return <RetailerDashboard contract={contract} account={account} />;
      case 'CONSUMER':
        return <ConsumerDashboard contract={contract} account={account} />;
      case 'REGULATOR':
        return <RegulatorDashboard contract={contract} account={account} />;
      case 'ADMIN':
        return <RegulatorDashboard contract={contract} account={account} isAdmin={true} />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>💊 PharmaTrace</h1>
          <p className="subtitle">Blockchain Supply Chain Tracking</p>
        </div>
        <WalletConnect
          account={account}
          userRole={userRole}
          chainId={chainId}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onSwitchAccount={handleSwitchAccount}
          loading={loading}
        />
      </header>

      <main className="App-main">
        {error && (
          <div className="error-banner">
            <strong>Error:</strong> {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {renderDashboard()}

        <ProductVerification contract={contract} />
      </main>

      <footer className="App-footer">
        <p>CSE540 Group 30 - PharmaTrace © 2025</p>
      </footer>
    </div>
  );
}

export default App;

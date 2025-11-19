import { ethers } from 'ethers';
import deployment from '../contracts/deployment.json';
import Provenance from '../contracts/Provenance.json';

const TARGET_CHAIN_ID = Number(deployment.chainId) || 31337;
const NETWORK_NAME = deployment.network || 'Configured Network';

const NETWORK_CONFIGS = {
  31337: {
    chainName: 'Hardhat Localhost',
    rpcUrls: ['http://127.0.0.1:8545'],
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: []
  },
  11155111: {
    chainName: 'Sepolia Testnet',
    rpcUrls: [process.env.REACT_APP_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'],
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://sepolia.etherscan.io']
  }
};

const toHexChainId = (chainId) => `0x${chainId.toString(16)}`;

const getNetworkMetadata = () => {
  return NETWORK_CONFIGS[TARGET_CHAIN_ID] || {
    chainName: NETWORK_NAME,
    rpcUrls: deployment.rpcUrls ? [deployment.rpcUrls] : [],
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: deployment.blockExplorerUrls || []
  };
};

export const connectWallet = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('Please install MetaMask to use this application');
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();
    
    return {
      account: accounts[0],
      provider,
      signer,
      chainId: Number(network.chainId)
    };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

export const getConfiguredChainId = () => TARGET_CHAIN_ID;
export const getConfiguredNetworkName = () => NETWORK_NAME;

export const switchToConfiguredNetwork = async () => {
  const metadata = getNetworkMetadata();
  const hexChainId = toHexChainId(TARGET_CHAIN_ID);

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      if (!metadata.rpcUrls || metadata.rpcUrls.length === 0) {
        throw new Error(`Add chain ${NETWORK_NAME} (chainId ${TARGET_CHAIN_ID}) to MetaMask manually.`);
      }
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: hexChainId,
            chainName: metadata.chainName,
            nativeCurrency: metadata.nativeCurrency,
            rpcUrls: metadata.rpcUrls,
            blockExplorerUrls: metadata.blockExplorerUrls
          }],
        });
      } catch (addError) {
        throw addError;
      }
    } else {
      throw switchError;
    }
  }
};

export const getContract = async (signer) => {
  try {
    return new ethers.Contract(
      deployment.contractAddress,
      Provenance.abi,
      signer
    );
  } catch (error) {
    console.error('Error loading contract:', error);
    throw new Error('Contract not deployed. Please run: npm run deploy:local');
  }
};

export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const formatProductId = (productId) => {
  if (!productId) return '';
  return `${productId.substring(0, 10)}...${productId.substring(productId.length - 8)}`;
};

export const STATUS_NAMES = [
  'Created',
  'Shipped',
  'InTransit',
  'Received',
  'InStock',
  'Sold',
  'Flagged'
];

export const getStatusName = (statusCode) => {
  return STATUS_NAMES[statusCode] || 'Unknown';
};

export const getStatusColor = (statusCode) => {
  const colors = {
    0: '#6366f1', // Created - Indigo
    1: '#f59e0b', // Shipped - Amber
    2: '#3b82f6', // InTransit - Blue
    3: '#10b981', // Received - Green
    4: '#8b5cf6', // InStock - Purple
    5: '#22c55e', // Sold - Green
    6: '#ef4444'  // Flagged - Red
  };
  return colors[statusCode] || '#6b7280';
};

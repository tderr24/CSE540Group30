import { useCallback, useEffect, useState } from 'react';

const normalizeProduct = (productStruct) => ({
  productId: productStruct.productId,
  name: productStruct.name,
  currentOwner: productStruct.currentOwner,
  status: Number(productStruct.status),
  metadataHash: productStruct.metadataHash,
  lastUpdateTime: Number(productStruct.lastUpdateTime)
});

const uniqueProductIds = (events) => {
  const ids = new Set();
  events.forEach((event) => {
    const id = event?.args?.productId || event?.args?.[0];
    if (id) {
      ids.add(id);
    }
  });
  return Array.from(ids.values());
};

export const useAccountProducts = (contract, account, options = {}) => {
  const { includeAll = false } = options;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProducts = useCallback(async () => {
    if (!contract) {
      setProducts([]);
      return;
    }

    if (!includeAll && !account) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!contract.filters?.ProductRegistered) {
        throw new Error('Contract ABI missing ProductRegistered event definition.');
      }

      const filter = contract.filters.ProductRegistered();
      const events = await contract.queryFilter(filter, 0, 'latest');
      const ids = uniqueProductIds(events);

      const details = await Promise.all(
        ids.map(async (productId) => {
          try {
            const product = await contract.getProductDetails(productId);
            return normalizeProduct(product);
          } catch (detailError) {
            console.warn('Skipping product fetch error', productId, detailError);
            return null;
          }
        })
      );

      const filtered = details
        .filter(Boolean)
        .filter((product) => includeAll || product.currentOwner?.toLowerCase() === account?.toLowerCase())
        .sort((a, b) => b.lastUpdateTime - a.lastUpdateTime);

      setProducts(filtered);
    } catch (err) {
      console.error('useAccountProducts error', err);
      setError(err?.shortMessage || err?.message || 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  }, [contract, account, includeAll]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!contract) return;
    const handler = () => fetchProducts();

    contract.on('ProductRegistered', handler);
    contract.on('OwnershipTransferred', handler);
    contract.on('StatusUpdated', handler);

    return () => {
      contract.off('ProductRegistered', handler);
      contract.off('OwnershipTransferred', handler);
      contract.off('StatusUpdated', handler);
    };
  }, [contract, fetchProducts]);

  return { products, loading, error, refresh: fetchProducts };
};

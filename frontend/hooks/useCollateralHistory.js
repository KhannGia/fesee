/**
 * Hook for managing Collateral NFT history in MongoDB
 * Similar to useLoanHistory but for collateral assets
 */

import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = '/api';

/**
 * Hook to fetch and manage collateral NFT list
 * @param {string} walletAddress - User's wallet address
 * @returns {Object} - { collaterals, loading, error, refetch }
 */
export function useCollateralHistory(walletAddress) {
  const [collaterals, setCollaterals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchCollaterals = useCallback(async (limit = 50, skip = 0) => {
    if (!walletAddress) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        walletAddress,
        limit: limit.toString(),
        skip: skip.toString()
      });

      const response = await fetch(`${API_BASE_URL}/collaterals?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch collaterals');
      }

      setCollaterals(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching collateral history:', err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      fetchCollaterals();
    } else {
      setCollaterals([]);
    }
  }, [walletAddress]); // Removed fetchCollaterals to prevent infinite loop

  return { collaterals, loading, error, pagination, refetch: fetchCollaterals };
}

/**
 * Hook to fetch collateral stats
 * @param {string} walletAddress - User's wallet address
 * @returns {Object} - { stats, loading, error, refetch }
 */
export function useCollateralStats(walletAddress) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!walletAddress) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/collaterals/stats?walletAddress=${walletAddress}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      setStats(data.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching collateral stats:', err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      fetchStats();
    } else {
      setStats(null);
    }
  }, [walletAddress]); // Removed fetchStats to prevent infinite loop

  return { stats, loading, error, refetch: fetchStats };
}

/**
 * Create new collateral record in database
 * @param {Object} collateralData - Collateral data from mint transaction
 * @returns {Promise<Object>} - Created collateral record
 */
export async function createCollateral(collateralData) {
  try {
    const response = await fetch(`${API_BASE_URL}/collaterals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(collateralData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create collateral record');
    }

    return data.data;
  } catch (error) {
    console.error('Error creating collateral:', error);
    throw error;
  }
}

/**
 * Update existing collateral record
 * @param {string} tokenId - NFT Token ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated collateral record
 */
export async function updateCollateral(tokenId, updates) {
  try {
    const response = await fetch(`${API_BASE_URL}/collaterals/${tokenId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update collateral');
    }

    return data.data;
  } catch (error) {
    console.error('Error updating collateral:', error);
    throw error;
  }
}

/**
 * Delete collateral record (when NFT is burned)
 * @param {string} tokenId - NFT Token ID
 * @returns {Promise<void>}
 */
export async function deleteCollateral(tokenId) {
  try {
    const response = await fetch(`${API_BASE_URL}/collaterals/${tokenId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete collateral');
    }

    return data;
  } catch (error) {
    console.error('Error deleting collateral:', error);
    throw error;
  }
}

/**
 * Get single collateral by token ID
 * @param {string} tokenId - NFT Token ID
 * @returns {Promise<Object>} - Collateral data
 */
export async function getCollateralByTokenId(tokenId) {
  try {
    const response = await fetch(`${API_BASE_URL}/collaterals/${tokenId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch collateral');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching collateral:', error);
    throw error;
  }
}

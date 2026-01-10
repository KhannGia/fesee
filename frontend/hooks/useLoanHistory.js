import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = '/api';

export function useLoanHistory(walletAddress) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchLoans = useCallback(async (status = null, limit = 50, skip = 0) => {
    if (!walletAddress) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        walletAddress,
        limit: limit.toString(),
        skip: skip.toString()
      });

      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`${API_BASE_URL}/loans?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch loans');
      }

      setLoans(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching loan history:', err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      fetchLoans();
    }
  }, [walletAddress, fetchLoans]);

  return { loans, loading, error, pagination, refetch: fetchLoans };
}

export function useLoanStats(walletAddress) {
  const [stats, setStats] = useState(null);
  const [recentLoans, setRecentLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!walletAddress) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/stats?walletAddress=${walletAddress}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      setStats(data.data.stats);
      setRecentLoans(data.data.recentLoans);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      fetchStats();
    }
  }, [walletAddress, fetchStats]);

  return { stats, recentLoans, loading, error, refetch: fetchStats };
}

// Helper functions for API calls
export async function createLoan(loanData) {
  try {
    const response = await fetch(`${API_BASE_URL}/loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loanData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create loan');
    }

    return data.data;
  } catch (error) {
    console.error('Error creating loan:', error);
    throw error;
  }
}

export async function updateLoan(loanId, updateData) {
  try {
    const response = await fetch(`${API_BASE_URL}/loans/${loanId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update loan');
    }

    return data.data;
  } catch (error) {
    console.error('Error updating loan:', error);
    throw error;
  }
}

export async function getLoan(loanId) {
  try {
    const response = await fetch(`${API_BASE_URL}/loans/${loanId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch loan');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching loan:', error);
    throw error;
  }
}

'use client';

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useLoanHistory, useLoanStats } from '../hooks/useLoanHistory';
import { 
  AlertCircle, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Calendar, 
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Zap,
  History,
  ExternalLink
} from 'lucide-react';

export default function LoanManager() {
  const { account, getAccountInfo, borrow, repay, payCommitmentFee, getInterestRate } = useWeb3();
  const { loans, loading: loansLoading, refetch: refetchLoans } = useLoanHistory(account);
  const { stats, recentLoans, loading: statsLoading, refetch: refetchStats } = useLoanStats(account);
  const [accountInfo, setAccountInfo] = useState(null);
  const [borrowAmount, setBorrowAmount] = useState('');
  const [borrowTerm, setBorrowTerm] = useState(30);
  const [selectedRate, setSelectedRate] = useState(5);
  const [maxAllowedTerm, setMaxAllowedTerm] = useState(365);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logs, setLogs] = useState([]);
  const [lastRepaidLoan, setLastRepaidLoan] = useState(null);

  // Add log helper
  const addLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { time, msg, type }]);
  };

  // Interest rate tiers
  const interestTiers = [
    { days: 7, label: '7 days', rate: 5, color: 'bg-green-500' },
    { days: 30, label: '30 days', rate: 5, color: 'bg-green-500' },
    { days: 60, label: '60 days', rate: 8, color: 'bg-yellow-500' },
    { days: 90, label: '90 days', rate: 8, color: 'bg-yellow-500' },
    { days: 120, label: '120 days', rate: 15, color: 'bg-orange-500' },
    { days: 180, label: '180 days', rate: 15, color: 'bg-orange-500' },
    { days: 365, label: '365 days', rate: 25, color: 'bg-red-500' }
  ];

  // Load account info
  useEffect(() => {
    if (account) {
      loadAccountInfo();
      
      // Auto-refresh every 30 seconds to sync with on-chain data
      const interval = setInterval(() => {
        loadAccountInfo();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [account]);

  // Update interest rate when term changes
  useEffect(() => {
    const fetchRate = async () => {
      if (borrowTerm > 0) {
        const rate = await getInterestRate(borrowTerm);
        setSelectedRate(rate);
      }
    };
    fetchRate();
  }, [borrowTerm, getInterestRate]);
  
  // Fetch last repaid loan from database for cooldown display
  useEffect(() => {
    const fetchLastRepaidLoan = async () => {
      if (!account) return;
      
      try {
        const response = await fetch(`/api/loans?walletAddress=${account}&status=repaid&limit=1`);
        if (response.ok) {
          const { data } = await response.json();
          if (data && data.length > 0) {
            setLastRepaidLoan(data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch last repaid loan:', err);
      }
    };
    
    fetchLastRepaidLoan();
  }, [account, loans]); // Re-fetch when loans change
  
  // Update max allowed term based on credit limit expiration
  useEffect(() => {
    if (accountInfo && accountInfo.daysUntilExpiration > 0) {
      const maxDays = Math.min(365, accountInfo.daysUntilExpiration);
      setMaxAllowedTerm(maxDays);
      // Không tự động adjust borrowTerm nữa - contract sẽ tự adjust
      // Chỉ hiển thị warning trong UI
    } else {
      setMaxAllowedTerm(365);
    }
  }, [accountInfo]);

  const loadAccountInfo = async () => {
    try {
      addLog('🔄 Loading account info...');
      const info = await getAccountInfo();
      setAccountInfo(info);
      
      // Debug log để check canBorrow
      console.log('📊 Account Info Debug:', {
        creditLimit: info.creditLimit,
        borrowed: info.borrowed,
        canBorrow: info.canBorrow,
        lastFullRepayment: info.lastFullRepayment,
        creditLimitExpiration: info.creditLimitExpiration,
        daysUntilExpiration: info.daysUntilExpiration
      });
      
      // Warning if canBorrow is false
      if (info.creditLimit > 0 && info.borrowed === 0 && !info.canBorrow) {
        console.warn('⚠️ WARNING: You have credit limit but cannot borrow!');
        console.warn('Possible reasons:');
        console.warn('- Credit limit expired:', info.creditLimitExpiration, 'vs now:', Math.floor(Date.now() / 1000));
        console.warn('- In cooldown period:', info.lastFullRepayment, '+ 5 days vs now');
        console.warn('- Using old contract? Current contract: 0x04e2AfF2287Ba41662778bE0F3C4dD61071C8555');
      }
      
      addLog(`✅ Account synced: Credit Limit $${parseFloat(info.creditLimit || 0).toFixed(1)}`, 'success');
    } catch (err) {
      console.error('Failed to load account info:', err);
      addLog('❌ Failed to load account info', 'error');
    }
  };

  const handleBorrow = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const amount = parseFloat(borrowAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid amount');
      }

      if (borrowTerm < 7 || borrowTerm > 365) {
        throw new Error('Term must be between 7 and 365 days');
      }
      
      // Check if term will be auto-adjusted
      const actualTerm = Math.min(borrowTerm, accountInfo?.daysUntilExpiration || 365);
      const termAdjusted = actualTerm < borrowTerm;

      addLog(`📤 Borrowing $${amount} USDC for ${borrowTerm} days at ${selectedRate}% APR...`);
      
      if (termAdjusted) {
        addLog(`⚠️ Loan term auto-adjusted to ${actualTerm} days (credit limit expiring)`, 'warning');
      }
      
      await borrow(amount, borrowTerm);
      
      setSuccess(`Successfully borrowed ${amount} USDC for ${actualTerm} days at ${selectedRate}% APR${termAdjusted ? ' (term auto-adjusted)' : ''}`);
      addLog(`✅ Loan approved! $${amount} USDC for ${actualTerm} days`, 'success');
      setBorrowAmount('');
      await loadAccountInfo();
      
      // Refresh loan history after borrow
      setTimeout(() => {
        refetchLoans();
        refetchStats();
      }, 2000); // Wait 2s for MongoDB to update
    } catch (err) {
      setError(err.message || 'Failed to borrow');
      addLog(`❌ Borrow failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      addLog('💳 Processing full loan repayment...');
      const result = await repay();
      setSuccess(`Successfully repaid ${result.amount.toFixed(2)} USDC${accountInfo?.isEarlyRepayment ? ' with 2% early repayment bonus!' : ''}`);
      addLog(`✅ Loan repaid successfully! $${result.amount.toFixed(2)} USDC`, 'success');
      await loadAccountInfo();
      
      // Refresh loan history after repay
      setTimeout(() => {
        refetchLoans();
        refetchStats();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to repay');
      addLog(`❌ Repay failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePayCommitmentFee = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      addLog('💰 Paying accumulated commitment fee...');
      const result = await payCommitmentFee();
      setSuccess(`Successfully paid commitment fee of ${result.amount.toFixed(4)} USDC`);
      addLog(`✅ Commitment fee paid! $${result.amount.toFixed(4)} USDC`, 'success');
      await loadAccountInfo();
    } catch (err) {
      setError(err.message || 'Failed to pay commitment fee');
      addLog(`❌ Payment failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <div className="glass-panel rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <Zap className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
          <h3 className="text-xl font-bold text-white mb-2">Wallet Not Connected</h3>
          <p className="text-slate-400">Please connect your wallet to manage loans and access DeFi services</p>
        </div>
      </div>
    );
  }

  const totalDebt = accountInfo ? parseFloat(accountInfo.borrowed) + parseFloat(accountInfo.interest) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <TrendingUp className="w-10 h-10 text-cyan-400" />
              Loan Management
            </h1>
            <p className="text-slate-400">Manage your credit, loans, and commitment fees</p>
          </div>
          <button
            onClick={() => {
              addLog('🔄 Manual refresh triggered...');
              loadAccountInfo();
              refetchLoans();
              refetchStats();
            }}
            className="glass-panel px-6 py-3 rounded-lg hover:border-cyan-500/30 transition-all duration-300 flex items-center gap-2 text-cyan-400"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>

        {/* Account Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass-panel rounded-xl p-6 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Credit Limit</p>
                <p className="text-3xl font-bold text-white mt-2">${accountInfo?.creditLimit || '0'}</p>
                {accountInfo && accountInfo.creditLimitExpiration > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Expires: {accountInfo.daysUntilExpiration > 0 
                      ? `${accountInfo.daysUntilExpiration} days` 
                      : 'EXPIRED'}
                  </p>
                )}
              </div>
              <DollarSign className="w-10 h-10 text-slate-700 group-hover:text-cyan-400 transition-colors" />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 hover:border-pink-500/30 transition-all duration-300 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Total Debt</p>
                <p className="text-3xl font-bold text-white mt-2">${totalDebt.toFixed(2)}</p>
                {accountInfo?.interest > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Principal: ${accountInfo.borrowed} | Interest: ${accountInfo.interest}
                  </p>
                )}
              </div>
              <TrendingDown className="w-10 h-10 text-slate-700 group-hover:text-pink-400 transition-colors" />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Available Credit</p>
                <p className="text-3xl font-bold text-emerald-400 mt-2">${accountInfo?.available ? parseFloat(accountInfo.available).toFixed(1) : '0.0'}</p>
              </div>
              <DollarSign className="w-10 h-10 text-slate-700 group-hover:text-emerald-400 transition-colors" />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 hover:border-orange-500/30 transition-all duration-300 cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Accumulated Fee</p>
                <p className="text-3xl font-bold text-white mt-2">${accountInfo?.commitmentFee || '0'}</p>
                <p className="text-xs text-slate-500 mt-1">0.5% APR on available credit</p>
              </div>
              <Clock className="w-10 h-10 text-slate-700 group-hover:text-orange-400 transition-colors" />
            </div>
          </div>
        </div>

        {/* Active Loan Info */}
        {accountInfo && parseFloat(accountInfo.borrowed) > 0 && (
          <div className="glass-panel rounded-xl p-8 mb-8 hover:border-slate-600/30 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <Zap className="w-5 h-5 text-cyan-400" />
              Active Loan Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30 hover:border-cyan-500/30 transition-all duration-300">
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Loan Term</p>
                <p className="text-2xl font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  {accountInfo.term} days
                </p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30 hover:border-cyan-500/30 transition-all duration-300">
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Interest Rate</p>
                <p className="text-2xl font-bold text-cyan-400">{accountInfo.interestRate}% APR</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30 hover:border-emerald-500/30 transition-all duration-300">
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Early Repayment</p>
                <p className={`text-xl font-bold ${accountInfo.isEarlyRepayment ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {accountInfo.isEarlyRepayment ? '✓ 2% Bonus!' : '✗ No Bonus'}
                </p>
              </div>
            </div>

            {accountInfo.isEarlyRepayment && (
              <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <p className="text-emerald-400 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Early Repayment Bonus Active! Pay now and save 2% on interest.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Main Content Grid: Forms on Left, Terminal & History on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Borrow/Repay Forms */}
          <div className="space-y-8">
            {/* Credit Limit Expiration Warning */}
            {accountInfo && accountInfo.daysUntilExpiration > 0 && accountInfo.daysUntilExpiration <= 60 && (
              <div className="glass-panel rounded-xl p-6 border-yellow-500/30 bg-yellow-500/5">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-yellow-400 mb-2">Credit Limit Expiring Soon</h4>
                    <p className="text-slate-300 mb-3">
                      Your credit limit will expire in {accountInfo.daysUntilExpiration} days. 
                      Please submit a new ZK proof to renew your credit limit.
                    </p>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Expiration Date:</p>
                      <p className="text-white font-mono">
                        {accountInfo.creditLimitExpiration > 0 
                          ? new Date(accountInfo.creditLimitExpiration * 1000).toLocaleString()
                          : 'N/A'}
                      </p>
                      <p className="text-xs text-yellow-400 mt-3">
                        ⚠️ Maximum loan term is limited to {accountInfo.daysUntilExpiration} days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Credit Limit Expired Warning */}
            {accountInfo && accountInfo.daysUntilExpiration === 0 && accountInfo.creditLimitExpiration > 0 && (
              <div className="glass-panel rounded-xl p-6 border-red-500/30 bg-red-500/5">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-red-400 mb-2">Credit Limit Expired</h4>
                    <p className="text-slate-300 mb-3">
                      Your credit limit has expired. You must submit a new ZK proof to get a new credit limit before you can borrow.
                    </p>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Expired On:</p>
                      <p className="text-red-400 font-mono">
                        {new Date(accountInfo.creditLimitExpiration * 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Cooldown Warning (if applicable) */}
            {accountInfo && !accountInfo.canBorrow && parseFloat(accountInfo.borrowed) === 0 && accountInfo.lastFullRepayment > 0 && (
              <div className="glass-panel rounded-xl p-6 border-orange-500/30 bg-orange-500/5">
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-orange-400 mb-2">Cooldown Period Active</h4>
                    <p className="text-slate-300 mb-3">
                      You must wait 5 days after full loan repayment before borrowing again.
                    </p>
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Last Repayment:</p>
                      <p className="text-white font-mono">
                        {lastRepaidLoan?.repaymentDate 
                          ? new Date(lastRepaidLoan.repaymentDate).toLocaleString()
                          : accountInfo.lastFullRepayment > 0
                            ? new Date(accountInfo.lastFullRepayment * 1000).toLocaleString()
                            : 'No repayment history'}
                      </p>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mt-3 mb-1">Can Borrow Again:</p>
                      <p className="text-cyan-400 font-mono font-bold">
                        {accountInfo.lastFullRepayment > 0 
                          ? new Date((accountInfo.lastFullRepayment + 5 * 24 * 60 * 60) * 1000).toLocaleString()
                          : 'WAIT 5 DAYS'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Borrow Form - Always visible */}
            <div className="glass-panel rounded-xl p-8 hover:border-slate-600/30 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-cyan-400" />
              Borrow Funds
            </h3>
            
            {/* Interest Rate Tiers */}
            <div className="mb-6">
              <p className="text-xs text-slate-500 mb-4 font-medium uppercase tracking-wide">Reverse Interest Curve (shorter term = lower rate):</p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {interestTiers.map((tier) => (
                  <button
                    key={tier.days}
                    type="button"
                    onClick={() => setBorrowTerm(tier.days)}
                    disabled={parseFloat(accountInfo?.borrowed || 0) > 0 || !accountInfo?.canBorrow}
                    className={`p-3 rounded-lg border transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                      borrowTerm === tier.days
                        ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                        : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`${tier.color} text-white text-xs font-bold px-2 py-1 rounded mb-2`}>
                      {tier.rate}% APR
                    </div>
                    <div className="text-xs font-medium text-slate-400">{tier.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleBorrow} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/30 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter amount"
                  disabled={loading || parseFloat(accountInfo?.borrowed || 0) > 0 || !accountInfo?.canBorrow}
                />
                {parseFloat(accountInfo?.borrowed || 0) > 0 && (
                  <p className="text-xs text-yellow-400 mt-2">
                    ⚠️ Please repay your current loan before borrowing again
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                  Loan Term (days)
                </label>
                <input
                type="number"
                min="7"
                max="365"
                value={borrowTerm}
                onChange={(e) => setBorrowTerm(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-slate-800/30 border border-slate-700/50 rounded-lg text-white placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || parseFloat(accountInfo?.borrowed || 0) > 0 || !accountInfo?.canBorrow}
              />
              <p className="text-xs text-slate-500 mt-2">
                Interest Rate: <span className="font-bold text-cyan-400">{selectedRate}% APR</span>
                {borrowTerm > maxAllowedTerm && maxAllowedTerm < 365 && (
                  <span className="block text-yellow-400 mt-1">
                    ⚠️ Term will be auto-adjusted to {maxAllowedTerm} days (credit limit expiring)
                  </span>
                )}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !borrowAmount || parseFloat(accountInfo?.borrowed || 0) > 0 || !accountInfo?.canBorrow}
              className="w-full bg-cyan-600/10 border border-cyan-500/50 hover:bg-cyan-600/20 hover:border-cyan-500 text-cyan-400 py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : parseFloat(accountInfo?.borrowed || 0) > 0 ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  Already Have Active Loan
                </>
              ) : !accountInfo?.canBorrow ? (
                <>
                  <Clock className="w-5 h-5" />
                  Cooldown Period Active
                </>
              ) : (
                <>
                  Borrow
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

      {/* Repay Button */}
      {parseFloat(accountInfo?.borrowed || 0) > 0 && (
        <div className="glass-panel rounded-xl p-8 hover:border-slate-600/30 transition-all duration-300">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <TrendingDown className="w-5 h-5 text-emerald-400" />
            Repay Loan
          </h3>
          <p className="text-slate-500 mb-6 text-sm">
            Total Amount to Repay: <span className="font-bold text-2xl text-emerald-400 block mt-2">${totalDebt.toFixed(2)} USDC</span>
          </p>
          <button
            onClick={handleRepay}
            disabled={loading}
            className="w-full bg-emerald-600/10 border border-emerald-500/50 hover:bg-emerald-600/20 hover:border-emerald-500 text-emerald-400 py-3 px-6 rounded-lg font-semibold disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Repay Full Amount
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Commitment Fee Payment */}
      {parseFloat(accountInfo?.commitmentFee || 0) > 0 && (
        <div className="glass-panel rounded-xl p-8 hover:border-slate-600/30 transition-all duration-300">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-400" />
            Pay Commitment Fee
          </h3>
          <p className="text-slate-500 mb-6 text-sm">
            You have an accumulated commitment fee of <span className="font-bold text-xl text-orange-400 block mt-2">${accountInfo.commitmentFee} USDC</span>
            <span className="text-xs block mt-2">This fee accrues at 0.5% APR on your available credit (credit limit - borrowed).</span>
          </p>
          <button
            onClick={handlePayCommitmentFee}
            disabled={loading}
            className="w-full bg-orange-600/10 border border-orange-500/50 hover:bg-orange-600/20 hover:border-orange-500 text-orange-400 py-3 px-6 rounded-lg font-semibold disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Pay Commitment Fee
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}
          </div>

          {/* Right Column: Terminal & Loan History */}
          <div className="space-y-8">
            {/* Terminal Log */}
            <div className="glass-panel rounded-xl overflow-hidden mb-8">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/60 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/70 hover:bg-rose-500 transition cursor-pointer" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70 hover:bg-amber-500 transition cursor-pointer" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70 hover:bg-emerald-500 transition cursor-pointer" />
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <span className="text-xs font-medium text-slate-400">Loan Manager Terminal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-600 bg-slate-800/80 px-2 py-0.5 rounded">
                {logs.length} entries
              </span>
            </div>
          </div>
          <div className="terminal-container p-4 font-mono text-xs h-64 overflow-y-auto space-y-1.5">
            <div className="text-slate-600 italic pb-2 border-b border-slate-800/50 mb-2">
              {'// '}StreamCredit Loan Manager v1.0 - Ready
            </div>
            {logs.map((log, i) => (
              <div key={i} className="log-entry flex items-start gap-2 py-0.5 hover:bg-slate-800/30 px-1 -mx-1 rounded transition">
                <span className="text-slate-700 select-none shrink-0">[{log.time}]</span>
                <span className={`flex-1 ${
                  log.type === 'error' ? 'text-rose-400' : 
                  log.type === 'success' ? 'text-emerald-400' : 'text-cyan-300'
                }`}>
                  <span className="text-slate-600 select-none">{'>'} </span>
                  {log.msg}
                </span>
              </div>
            ))}
            {loading && (
              <div className="text-cyan-400 animate-pulse flex items-center gap-2 py-1">
                <RefreshCw size={12} className="animate-spin" />
                Processing...
              </div>
            )}
            {logs.length === 0 && !loading && (
              <div className="text-slate-600 text-center py-8">
                <History size={24} className="mx-auto mb-2 opacity-50" />
                <p>Loan transaction logs will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="glass-panel rounded-xl p-4 hover:border-slate-700/30 transition-all duration-300 cursor-pointer">
              <p className="text-slate-400 text-sm">Total Loans</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalLoans}</p>
              <p className="text-xs text-slate-500 mt-1">
                Active: {stats.activeLoans} | Repaid: {stats.repaidLoans}
              </p>
            </div>
            
            <div className="glass-panel rounded-xl p-4 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer">
              <p className="text-slate-400 text-sm">Total Borrowed</p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">${stats.totalBorrowed?.toFixed(2) || '0'}</p>
              <p className="text-xs text-slate-500 mt-1">
                Avg: ${stats.avgLoanAmount?.toFixed(2) || '0'}
              </p>
            </div>
            
            <div className="glass-panel rounded-xl p-4 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer">
              <p className="text-slate-400 text-sm">Total Repaid</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">${stats.totalRepaid?.toFixed(2) || '0'}</p>
              <p className="text-xs text-slate-500 mt-1">
                Interest: ${stats.totalInterestPaid?.toFixed(2) || '0'}
              </p>
            </div>
            
            <div className="glass-panel rounded-xl p-4 hover:border-yellow-500/30 transition-all duration-300 cursor-pointer">
              <p className="text-slate-400 text-sm">Early Repayments</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.earlyRepaymentCount || 0}</p>
              <p className="text-xs text-slate-500 mt-1">
                2% bonus saved
              </p>
            </div>
          </div>
        )}

        {/* Loan History Table */}
        <div className="glass-panel rounded-2xl p-6 hover:border-slate-700/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <History className="w-6 h-6 text-cyan-400" />
              Loan History
            </h2>
            <button
              onClick={() => {
                refetchLoans();
                refetchStats();
              }}
              disabled={loansLoading || statsLoading}
              className="text-slate-400 hover:text-cyan-400 transition-all duration-300 hover:scale-110 p-2 rounded-lg hover:bg-slate-800/50"
            >
              <RefreshCw className={`w-5 h-5 ${(loansLoading || statsLoading) ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loansLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-3" />
              <p className="text-slate-400">Loading loan history...</p>
            </div>
          ) : loans && loans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Date</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Amount</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Term</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Rate</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Interest Paid</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Status</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => (
                    <tr key={loan.loanId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 text-slate-300 text-sm">
                        {new Date(loan.borrowedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-4 text-white font-semibold">
                        ${loan.principal?.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-slate-300 text-sm">
                        {loan.termDays} days
                      </td>
                      <td className="py-4 px-4 text-slate-300 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded ${
                          loan.interestRate === 5 ? 'bg-green-500/20 text-green-400' :
                          loan.interestRate === 8 ? 'bg-yellow-500/20 text-yellow-400' :
                          loan.interestRate === 15 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {loan.interestRate}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-300 text-sm">
                        {loan.interestPaid ? (
                          <span className="text-amber-400">
                            ${loan.interestPaid.toFixed(2)}
                            {loan.earlyRepaymentBonus && (
                              <span className="ml-1 text-xs text-green-400">⚡ -2%</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          loan.status === 'repaid' ? 'bg-emerald-500/20 text-emerald-400' :
                          loan.status === 'partial' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-cyan-500/20 text-cyan-400'
                        }`}>
                          {loan.status === 'repaid' ? '✓ Repaid' : 
                           loan.status === 'partial' ? '⚡ Partial' : 
                           '⏳ Active'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <a
                          href={`https://sepolia.etherscan.io/tx/${loan.borrowTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1 text-sm"
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400">No loan history yet</p>
              <p className="text-slate-500 text-sm mt-1">Your loan transactions will appear here</p>
            </div>
          )}
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}

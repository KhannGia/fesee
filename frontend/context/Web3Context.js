/**
 * Web3 Context Provider for StreamCredit
 * Handles wallet connection and contract interactions
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { STREAM_CREDIT_ABI, COLLATERAL_NFT_ABI } from '../config/abi';
import { CONTRACTS } from '../config/constants';
import { createLoan, updateLoan } from '../hooks/useLoanHistory';
import { createCollateral, updateCollateral } from '../hooks/useCollateralHistory';

// Contract addresses now imported from config/constants.js

// Sepolia Chain ID
const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';

const Web3Context = createContext(null);

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [streamCreditContract, setStreamCreditContract] = useState(null);
  const [collateralNFT, setCollateralNFT] = useState(null);
  const [allAccounts, setAllAccounts] = useState([]); // Track all connected accounts

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && window.ethereum;

  // Initialize provider on mount - but DON'T auto-connect
  useEffect(() => {
    if (isMetaMaskInstalled) {
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethersProvider);

      // Listen for account changes (when user switches in MetaMask)
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log('MetaMask accounts changed:', accounts);
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
          setAllAccounts(accounts);
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', (newChainId) => {
        setChainId(parseInt(newChainId, 16));
        // Don't reload - just update state
        console.log('Chain changed to:', parseInt(newChainId, 16));
      });

      // DON'T auto-connect - let user click "Connect Wallet" button
      // This allows testing with different wallets
    }
  }, []);

  // Initialize contracts when signer is available
  useEffect(() => {
    if (signer) {
      const streamContract = new ethers.Contract(
        CONTRACTS.streamCredit,
        STREAM_CREDIT_ABI,
        signer
      );
      setStreamCreditContract(streamContract);
      
      const collateralContract = new ethers.Contract(
        CONTRACTS.collateralNFT,
        COLLATERAL_NFT_ABI,
        signer
      );
      setCollateralNFT(collateralContract);
    }
  }, [signer]);

  // Update signer when account changes
  useEffect(() => {
    if (provider && account) {
      provider.getSigner().then(setSigner);
    }
  }, [provider, account]);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      setError('MetaMask is not installed. Please install it from metamask.io');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request accounts
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      setAccount(accounts[0]);

      // Check chain
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainIdHex, 16);
      setChainId(currentChainId);

      // Switch to Sepolia if not on it
      if (currentChainId !== SEPOLIA_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }]
          });
        } catch (switchError) {
          // Chain not added, try to add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: SEPOLIA_CHAIN_ID_HEX,
                chainName: 'Sepolia Testnet',
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://rpc.sepolia.org'],
                blockExplorerUrls: ['https://sepolia.etherscan.io']
              }]
            });
          } else {
            throw switchError;
          }
        }
      }

      setIsConnecting(false);
      return true;
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError(err.message || 'Failed to connect wallet');
      setIsConnecting(false);
      return false;
    }
  }, [isMetaMaskInstalled]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setStreamCreditContract(null);
    setCollateralNFT(null);
    setAllAccounts([]);
    console.log('Wallet disconnected');
  }, []);

  // Switch to a different account - opens MetaMask account selector
  const switchAccount = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      setError('MetaMask is not installed');
      return false;
    }

    try {
      // Request wallet_requestPermissions to force MetaMask to show account picker
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });

      // Get the newly selected account
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setAllAccounts(accounts);
        console.log('Switched to account:', accounts[0]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to switch account:', err);
      setError(err.message || 'Failed to switch account');
      return false;
    }
  }, [isMetaMaskInstalled]);

  // Get account info from contract
  const getAccountInfo = useCallback(async () => {
    if (!streamCreditContract || !account) return null;

    try {
      const info = await streamCreditContract.getAccountInfo(account);
      return {
        creditLimit: ethers.formatUnits(info._creditLimit, 6), // USDC has 6 decimals
        borrowed: ethers.formatUnits(info._borrowed, 6),
        available: ethers.formatUnits(info._available, 6),
        interest: ethers.formatUnits(info._interest, 6),
        commitmentFee: ethers.formatUnits(info._commitmentFee, 6),
        term: Number(info._term),
        interestRate: Number(info._interestRate) / 100, // Convert basis points to percentage
        isEarlyRepayment: info._isEarly,
        lastFullRepayment: Number(info._lastFullRepayment),
        canBorrow: info._canBorrow,
        creditLimitExpiration: Number(info._creditLimitExpiration),
        daysUntilExpiration: Number(info._daysUntilExpiration)
      };
    } catch (err) {
      console.error('Failed to get account info:', err);
      return null;
    }
  }, [streamCreditContract, account]);

  // Submit ZK proof to contract
  const submitZKProof = useCallback(async (proof, publicSignals, revenue) => {
    if (!streamCreditContract) {
      throw new Error('Contract not initialized. Please connect wallet first.');
    }

    try {
      // For MockVerifier, we can send any valid uint256 values
      // The proof format from mock API uses hex strings, convert to BigInt
      const parseHexOrNumber = (val) => {
        if (typeof val === 'string' && val.startsWith('0x')) {
          // Truncate to valid uint256 range
          return BigInt(val.slice(0, 66));
        }
        return BigInt(val || '0');
      };

      // Parse proof components
      const a = [
        parseHexOrNumber(proof.pi_a?.[0] || '1'),
        parseHexOrNumber(proof.pi_a?.[1] || '2')
      ];
      const b = [
        [
          parseHexOrNumber(proof.pi_b?.[0]?.[0] || '1'),
          parseHexOrNumber(proof.pi_b?.[0]?.[1] || '2')
        ],
        [
          parseHexOrNumber(proof.pi_b?.[1]?.[0] || '3'),
          parseHexOrNumber(proof.pi_b?.[1]?.[1] || '4')
        ]
      ];
      const c = [
        parseHexOrNumber(proof.pi_c?.[0] || '1'),
        parseHexOrNumber(proof.pi_c?.[1] || '2')
      ];
      
      // input[0] should be 1 (isValid = true)
      const input = [BigInt(1)];

      // Convert revenue to USDC format (6 decimals)
      const revenueInUSDC = ethers.parseUnits(revenue.toString(), 6);

      console.log('Submitting ZK proof to contract...');
      console.log('a:', a);
      console.log('b:', b);
      console.log('c:', c);
      console.log('input:', input);
      console.log('revenue:', revenueInUSDC.toString());

      // Try calling static first to catch revert reason
      try {
        await streamCreditContract.verifyAndUpdateCredit.staticCall(
          a, b, c, input, revenueInUSDC
        );
        console.log('✅ Static call succeeded - transaction should work');
      } catch (staticError) {
        console.error('❌ Static call failed:', staticError);
        throw new Error(`Contract will revert: ${staticError.message}`);
      }

      const tx = await streamCreditContract.verifyAndUpdateCredit(
        a, b, c, input, revenueInUSDC
      );

      console.log('Transaction submitted:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      return {
        success: true,
        txHash: tx.hash,
        receipt
      };
    } catch (err) {
      console.error('Failed to submit ZK proof:', err);
      throw err;
    }
  }, [streamCreditContract]);

  // Get interest rate for a given term
  const getInterestRate = useCallback(async (termDays) => {
    if (!streamCreditContract) return 0;

    try {
      const rate = await streamCreditContract.getInterestRate(termDays);
      return Number(rate) / 100; // Convert basis points to percentage
    } catch (err) {
      console.error('Failed to get interest rate:', err);
      return 0;
    }
  }, [streamCreditContract]);

  // Borrow from contract with term
  const borrow = useCallback(async (amount, termDays) => {
    if (!streamCreditContract || !signer) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      const amountInUSDC = ethers.parseUnits(amount.toString(), 6);
      console.log('Borrowing:', ethers.formatUnits(amountInUSDC, 6), 'USDC for', termDays, 'days');
      
      const tx = await streamCreditContract.borrow(amountInUSDC, termDays);
      console.log('Borrow tx submitted:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Borrow confirmed:', receipt);
      
      // Save to MongoDB
      try {
        const accountInfo = await getAccountInfo();
        const interestRate = await getInterestRate(termDays);
        
        await createLoan({
          walletAddress: account,
          principal: parseFloat(amount),
          termDays: termDays,
          interestRate: interestRate,
          borrowTxHash: tx.hash,
          creditLimitAtBorrow: accountInfo ? parseFloat(accountInfo.creditLimit) : 0,
          network: 'sepolia'
        });
        
        console.log('✅ Loan saved to database');
      } catch (dbErr) {
        console.error('⚠️ Failed to save loan to database:', dbErr);
        // Don't throw - transaction already succeeded
      }
      
      return {
        success: true,
        txHash: tx.hash,
        receipt
      };
    } catch (err) {
      console.error('Failed to borrow:', err);
      throw err;
    }
  }, [streamCreditContract, signer, account, getAccountInfo, getInterestRate]);

  // Repay to contract (supports both partial and full repayment)
  const repay = useCallback(async (amount = 0) => {
    if (!streamCreditContract || !signer) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      // First get account info
      const accountInfo = await getAccountInfo();
      if (!accountInfo) throw new Error('Failed to get account info');
      
      const principal = parseFloat(accountInfo.borrowed);
      const interest = parseFloat(accountInfo.interest);
      const totalDebt = principal + interest;
      
      console.log('Total debt:', totalDebt.toFixed(6), 'USDC');
      console.log('Requested repay amount:', amount === 0 ? 'FULL' : amount.toFixed(6), 'USDC');
      
      if (totalDebt === 0) {
        throw new Error('No active loan to repay');
      }
      
      // Setup USDC contract
      const usdcContract = new ethers.Contract(
        CONTRACTS.mockUSDC,
        [
          'function approve(address spender, uint256 amount) returns (bool)',
          'function balanceOf(address account) view returns (uint256)',
          'function faucet(uint256 amount) external'
        ],
        signer
      );
      
      // Check balance
      const balance = await usdcContract.balanceOf(account);
      const balanceUSDC = parseFloat(ethers.formatUnits(balance, 6));
      console.log('Current USDC balance:', balanceUSDC);
      
      // Auto-mint USDC with buffer to avoid rounding/approval issues
      const requiredBalance = totalDebt + 50; // +50 USDC buffer
      if (balanceUSDC < requiredBalance) {
        const needed = requiredBalance - balanceUSDC;
        console.log('Minting', needed.toFixed(2), 'USDC for buffer...');
        
        try {
          const mintTx = await usdcContract.faucet(ethers.parseUnits(needed.toFixed(6), 6));
          await mintTx.wait();
          console.log('✅ USDC minted successfully. New balance:', (balanceUSDC + needed).toFixed(2), 'USDC');
        } catch (mintErr) {
          console.error('Failed to mint USDC:', mintErr);
          throw new Error(`Insufficient USDC. Need ~${totalDebt.toFixed(2)} USDC but have ${balanceUSDC.toFixed(2)} USDC. Please get test USDC from faucet.`);
        }
      }
      
      // Approve unlimited USDC to avoid precision issues
      console.log('Approving unlimited USDC...');
      const maxUint256 = ethers.MaxUint256;
      const approveTx = await usdcContract.approve(CONTRACTS.streamCredit, maxUint256);
      console.log('Approve tx submitted:', approveTx.hash);
      await approveTx.wait();
      console.log('USDC approved');
      
      // CRITICAL FIX: Always call repay(0) for full repayment to avoid rounding errors
      // Contract will calculate exact totalDebt and reset borrowed to 0
      const repayAmountParam = amount === 0 ? 0 : ethers.parseUnits(amount.toFixed(6), 6);
      
      console.log('Repaying loan with amount:', amount === 0 ? '0 (FULL REPAYMENT)' : amount.toFixed(6));
      const tx = await streamCreditContract.repay(repayAmountParam, { gasLimit: 300000 });
      console.log('Repay tx submitted:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Repay confirmed:', receipt);
      
      // Update loan in MongoDB
      try {
        // Find the most recent active loan for this wallet
        const response = await fetch(`/api/loans?walletAddress=${account}&status=active&limit=1`);
        if (response.ok) {
          const { data } = await response.json();
          if (data && data.length > 0) {
            const activeLoan = data[0];
            
            await updateLoan(activeLoan.loanId, {
              repayTxHash: tx.hash,
              interestPaid: parseFloat(interest),
              principalPaid: parseFloat(principal),
              totalRepaid: amount === 0 ? totalDebt : amount,
              earlyRepaymentBonus: accountInfo.isEarlyRepayment,
              status: amount === 0 ? 'repaid' : 'partial'
            });
            
            console.log('✅ Loan updated in database');
          }
        }
      } catch (dbErr) {
        console.error('⚠️ Failed to update loan in database:', dbErr);
        // Don't throw - transaction already succeeded
      }
      
      return {
        success: true,
        txHash: tx.hash,
        receipt,
        amount: amount === 0 ? totalDebt : amount,
        isFull: amount === 0
      };
    } catch (err) {
      console.error('Failed to repay:', err);
      throw err;
    }
  }, [streamCreditContract, signer, getAccountInfo, account]);

  // Mint collateral NFT and save to MongoDB
  const mintCollateral = useCallback(async (assetName, assetType, estimatedValue, description, imageIPFSHash, fileHash, metadataURI, originalFilename, fileSize, mimeType) => {
    if (!collateralNFT || !signer || !account) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      const valueInUSDC = Math.floor(parseFloat(estimatedValue) * 1e6);
      
      console.log('Minting collateral NFT...');
      const tx = await collateralNFT.mintCollateral(
        account,
        assetName,
        assetType,
        valueInUSDC,
        description,
        imageIPFSHash,
        fileHash,
        metadataURI
      );
      
      console.log('Mint tx submitted:', tx.hash);
      const receipt = await tx.wait();
      console.log('Mint confirmed:', receipt);
      
      // Extract tokenId from event
      const mintEvent = receipt.logs.find(log => {
        try {
          const parsed = collateralNFT.interface.parseLog(log);
          return parsed.name === 'CollateralMinted';
        } catch {
          return false;
        }
      });
      
      let tokenId = 'Unknown';
      if (mintEvent) {
        const parsed = collateralNFT.interface.parseLog(mintEvent);
        tokenId = parsed.args.tokenId.toString();
      }
      
      // Save to MongoDB
      try {
        const ASSET_TYPES = [
          { value: 0, label: 'Bất động sản' },
          { value: 1, label: 'Xe cộ' },
          { value: 2, label: 'Máy móc thiết bị' },
          { value: 3, label: 'Hàng tồn kho' },
          { value: 4, label: 'Tài sản trí tuệ' },
          { value: 5, label: 'Chứng khoán' },
          { value: 6, label: 'Khác' }
        ];
        
        await createCollateral({
          walletAddress: account,
          tokenId: tokenId,
          contractAddress: CONTRACTS.collateralNFT,
          assetName,
          assetType: assetType,
          assetTypeLabel: ASSET_TYPES[assetType]?.label || 'Unknown',
          estimatedValue: valueInUSDC,
          description,
          imageIPFSHash,
          imageURL: `https://${imageIPFSHash}.ipfs.thirdwebstorage.com`,
          metadataURI,
          fileSize,
          mimeType,
          mintTxHash: tx.hash
        });
        
        console.log('✅ Collateral saved to database');
      } catch (dbErr) {
        console.error('⚠️ Failed to save collateral to database:', dbErr);
        // Don't throw - NFT already minted
      }
      
      return {
        success: true,
        txHash: tx.hash,
        receipt,
        tokenId
      };
    } catch (err) {
      console.error('Failed to mint collateral:', err);
      throw err;
    }
  }, [collateralNFT, signer, account]);

  // Lock collateral for loan
  const lockCollateral = useCallback(async (tokenId, loanAmount) => {
    if (!streamCreditContract || !signer || !account) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      console.log('Locking collateral tokenId:', tokenId, 'for loan amount:', loanAmount);
      
      const tx = await streamCreditContract.lockCollateral(tokenId, ethers.parseUnits(loanAmount.toString(), 6));
      console.log('Lock tx submitted:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Lock confirmed:', receipt);
      
      // Update in MongoDB
      try {
        await updateCollateral(tokenId, {
          action: 'lock',
          contractAddress: CONTRACTS.streamCredit,
          loanAmount: Math.floor(parseFloat(loanAmount) * 1e6),
          lockTxHash: tx.hash
        });
        
        console.log('✅ Collateral lock status updated in database');
      } catch (dbErr) {
        console.error('⚠️ Failed to update collateral in database:', dbErr);
      }
      
      return {
        success: true,
        txHash: tx.hash,
        receipt
      };
    } catch (err) {
      console.error('Failed to lock collateral:', err);
      throw err;
    }
  }, [streamCreditContract, signer, account]);

  // Unlock collateral after loan repaid
  const unlockCollateral = useCallback(async (tokenId) => {
    if (!streamCreditContract || !signer || !account) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      console.log('Unlocking collateral tokenId:', tokenId);
      
      const tx = await streamCreditContract.unlockCollateral(tokenId);
      console.log('Unlock tx submitted:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Unlock confirmed:', receipt);
      
      // Update in MongoDB
      try {
        await updateCollateral(tokenId, {
          action: 'unlock',
          unlockTxHash: tx.hash
        });
        
        console.log('✅ Collateral unlock status updated in database');
      } catch (dbErr) {
        console.error('⚠️ Failed to update collateral in database:', dbErr);
      }
      
      return {
        success: true,
        txHash: tx.hash,
        receipt
      };
    } catch (err) {
      console.error('Failed to unlock collateral:', err);
      throw err;
    }
  }, [streamCreditContract, signer, account]);

  // Pay commitment fee
  const payCommitmentFee = useCallback(async () => {
    if (!streamCreditContract || !signer) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      console.log('🔍 Contract addresses:');
      console.log('  StreamCredit:', CONTRACTS.streamCredit);
      console.log('  MockUSDC:', CONTRACTS.mockUSDC);
      
      const accountInfo = await getAccountInfo();
      if (!accountInfo) throw new Error('Failed to get account info');
      
      const fee = parseFloat(accountInfo.commitmentFee);
      console.log('💰 Commitment fee to pay:', fee, 'USDC');
      
      if (fee === 0 || isNaN(fee)) {
        throw new Error('No commitment fee to pay (0 USDC)');
      }
      
      // Check USDC balance first
      const usdcContract = new ethers.Contract(
        CONTRACTS.mockUSDC,
        [
          'function approve(address spender, uint256 amount) returns (bool)',
          'function balanceOf(address account) view returns (uint256)',
          'function allowance(address owner, address spender) view returns (uint256)',
          'function faucet(uint256 amount) external'
        ],
        signer
      );
      
      const balance = await usdcContract.balanceOf(account);
      const balanceUSDC = parseFloat(ethers.formatUnits(balance, 6));
      console.log('Your USDC balance:', balanceUSDC);
      
      const feeInUSDC = ethers.parseUnits(fee.toFixed(6), 6);
      
      // Auto-mint USDC with buffer to avoid rounding/approval issues
      const requiredBalance = fee + 50; // +50 USDC buffer
      if (balanceUSDC < requiredBalance) {
        const needed = requiredBalance - balanceUSDC;
        console.log('Minting', needed.toFixed(2), 'USDC for buffer...');
        
        try {
          const mintTx = await usdcContract.faucet(ethers.parseUnits(needed.toFixed(6), 6));
          await mintTx.wait();
          console.log('✅ USDC minted successfully. New balance:', (balanceUSDC + needed).toFixed(2), 'USDC');
        } catch (mintErr) {
          console.error('Failed to mint USDC:', mintErr);
          throw new Error(`Insufficient USDC balance. Need ${fee.toFixed(6)} USDC but have ${balanceUSDC.toFixed(6)} USDC`);
        }
      }
      
      // Approve unlimited USDC to avoid precision issues (same as repay)
      console.log('Approving unlimited USDC...');
      const maxUint256 = ethers.MaxUint256;
      const approveTx = await usdcContract.approve(CONTRACTS.streamCredit, maxUint256, { gasLimit: 100000 });
      console.log('Approve tx submitted:', approveTx.hash);
      const approveReceipt = await approveTx.wait();
      console.log('✅ Approve confirmed in block:', approveReceipt.blockNumber);
      
      // Verify allowance after approval
      const allowance = await usdcContract.allowance(account, CONTRACTS.streamCredit);
      console.log('Current allowance:', ethers.formatUnits(allowance, 6), 'USDC');
      
      // Wait a bit to ensure blockchain state is updated
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Pay fee (with manual gas limit)
      console.log('Paying commitment fee...');
      const tx = await streamCreditContract.payCommitmentFee({ gasLimit: 250000 });
      console.log('Payment tx submitted:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Payment confirmed:', receipt);
      
      return {
        success: true,
        txHash: tx.hash,
        receipt,
        amount: fee
      };
    } catch (err) {
      console.error('Failed to pay commitment fee:', err);
      throw err;
    }
  }, [streamCreditContract, signer, getAccountInfo, account]);

  const value = {
    // State
    account,
    allAccounts,
    chainId,
    isConnecting,
    error,
    isConnected: !!account,
    isOnSepolia: chainId === SEPOLIA_CHAIN_ID,
    
    // Methods
    connectWallet,
    disconnectWallet,
    switchAccount,
    getAccountInfo,
    submitZKProof,
    borrow,
    repay,
    payCommitmentFee,
    getInterestRate,
    
    // Collateral methods
    mintCollateral,
    lockCollateral,
    unlockCollateral,
    
    // Contract
    streamCreditContract,
    collateralNFT,
    signer,  // Export signer for direct contract interactions
    provider,  // Export provider for read operations
    
    // Constants
    contracts: CONTRACTS
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}

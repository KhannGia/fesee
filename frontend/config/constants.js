// Contract addresses come from the environment so a redeploy never needs a
// source edit. Copy them out of contracts/deployed-addresses-<network>.json
// into frontend/.env.local after running scripts/deploy.js.
export const CONTRACTS = {
  streamCredit: process.env.NEXT_PUBLIC_STREAM_CREDIT_ADDRESS || '',
  mockUSDC: process.env.NEXT_PUBLIC_MOCK_USDC_ADDRESS || '',
  collateralNFT: process.env.NEXT_PUBLIC_COLLATERAL_NFT_ADDRESS || '',
}

/**
 * Addresses that are missing from the environment. The app uses this to fail
 * loudly rather than sending transactions to the zero address.
 */
export function missingContractAddresses() {
  return Object.entries(CONTRACTS)
    .filter(([, address]) => !address)
    .map(([name]) => name)
}

// Mock API endpoint - Use Render backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_MOCK_API_URL || 'http://localhost:3001'

// API Endpoints
export const API_ENDPOINTS = {
  // Data endpoints
  HONEST_DATA: '/api/user/honest',
  FRAUD_DATA: '/api/user/fraud',
  
  // Analysis endpoints
  BENFORD_ANALYZE: '/api/analyze/benford',
  QUICK_CHECK: '/api/analyze/quick-check',
  
  // Credit endpoints
  CREDIT_EVALUATE: '/api/credit/evaluate',
  CREDIT_QUICK_SCORE: '/api/credit/quick-score',
  CREDIT_DEMO: '/api/credit/demo',
  
  // Wallet endpoints
  WALLET_POSITION: '/api/wallet',
  WALLET_BORROW: '/api/wallet/borrow',
  WALLET_REPAY: '/api/wallet/repay',
  WALLET_UPDATE_CREDIT: '/api/wallet/update-credit',
  
  // ZK endpoints
  ZK_GENERATE_PROOF: '/api/zk/generate-proof',
  ZK_VERIFY_PROOF: '/api/zk/verify-proof'
}

// Sepolia chain config
export const SEPOLIA_CHAIN = {
  id: 11155111,
  name: 'Sepolia',
  network: 'sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Sepolia ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc2.sepolia.org'],
    },
    public: {
      http: ['https://rpc.sepolia.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
  },
  testnet: true,
}

// Demo scenarios
export const SCENARIOS = {
  HONEST: {
    name: 'Honest Seller',
    description: 'Shop online với doanh thu tự nhiên, tuân theo Benford\'s Law',
    endpoint: '/api/user/honest',
    expectedResult: 'success',
    icon: '✅'
  },
  FRAUD: {
    name: 'Wash Trader',
    description: 'Tài khoản gian lận với dấu hiệu wash trading',
    endpoint: '/api/user/fraud',
    expectedResult: 'failed',
    icon: '⚠️'
  }
}

// Lending parameters
// Mirrors the constants in StreamCredit.sol — keep both in sync.
export const LENDING_PARAMS = {
  CREDIT_RATIO: 30, // CREDIT_RATIO: credit limit = 30% of proven revenue
  REVENUE_THRESHOLD: 1000, // minProvenRevenue, in USDC
  FRAUD_THRESHOLD: 20, // maxBenfordThreshold, rejected above this
  // Reverse interest curve: APR (%) by loan term, not a single flat rate.
  INTEREST_RATES: [
    { maxDays: 30, apr: 5 },
    { maxDays: 90, apr: 8 },
    { maxDays: 180, apr: 15 },
    { maxDays: 365, apr: 25 },
  ],
}

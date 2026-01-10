const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// =============================================
// BENFORD'S LAW ANALYZER
// =============================================
const BENFORD_EXPECTED = [0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046];

function calculateBenfordScore(amounts) {
  const digitCounts = new Array(9).fill(0);
  let total = 0;

  amounts.forEach(amount => {
    const amountStr = Math.floor(Math.abs(amount)).toString();
    const firstDigit = parseInt(amountStr[0]);
    if (firstDigit >= 1 && firstDigit <= 9) {
      digitCounts[firstDigit - 1]++;
      total++;
    }
  });

  if (total === 0) return { score: 0, chiSquare: 0, digitDistribution: [] };

  // Calculate actual distribution
  const digitDistribution = digitCounts.map((count, i) => ({
    digit: i + 1,
    expected: (BENFORD_EXPECTED[i] * 100).toFixed(1) + '%',
    actual: ((count / total) * 100).toFixed(1) + '%',
    count: count
  }));

  // Chi-square test
  let chiSquare = 0;
  for (let i = 0; i < 9; i++) {
    const observed = digitCounts[i];
    const expected = BENFORD_EXPECTED[i] * total;
    if (expected > 0) {
      chiSquare += Math.pow(observed - expected, 2) / expected;
    }
  }

  // Convert to fraud probability (0-100 scale)
  // Lower chi-square = more compliant with Benford = lower fraud risk
  const fraudProbability = Math.min(100, Math.round(chiSquare * 2.5));
  
  return {
    score: Math.round(chiSquare),
    chiSquare: chiSquare.toFixed(2),
    fraudProbability,
    isFraud: fraudProbability > 20,
    interpretation: fraudProbability <= 10 ? 'Excellent - Follows Benford\'s Law' :
                    fraudProbability <= 20 ? 'Good - Minor deviations' :
                    fraudProbability <= 40 ? 'Warning - Significant deviations' :
                    'Danger - Likely fraudulent data',
    digitDistribution
  };
}

// =============================================
// CREDIT SCORING ENGINE  
// =============================================
function calculateCreditScore(orders) {
  if (!orders || orders.length === 0) {
    return { score: 0, decision: 'REJECTED', creditLimit: 0, reasons: ['No transaction data'] };
  }

  const amounts = orders.map(o => o.amount);
  const totalRevenue = amounts.reduce((sum, a) => sum + a, 0);
  const avgOrderValue = totalRevenue / orders.length;
  const monthlyAvgRevenue = totalRevenue / 12; // Assume 12 months of data

  // Run Benford analysis
  const benford = calculateBenfordScore(amounts);

  // Calculate credit score (0-100)
  let score = 50; // Base score
  
  // Revenue factor (+/- 20)
  if (monthlyAvgRevenue > 50000) score += 20;
  else if (monthlyAvgRevenue > 20000) score += 15;
  else if (monthlyAvgRevenue > 10000) score += 10;
  else if (monthlyAvgRevenue > 5000) score += 5;
  else score -= 10;

  // Order count factor (+/- 15)
  if (orders.length > 500) score += 15;
  else if (orders.length > 200) score += 10;
  else if (orders.length > 100) score += 5;
  else score -= 5;

  // Benford compliance factor (+/- 15)
  if (benford.fraudProbability <= 10) score += 15;
  else if (benford.fraudProbability <= 20) score += 10;
  else if (benford.fraudProbability <= 30) score += 0;
  else if (benford.fraudProbability <= 50) score -= 10;
  else score -= 25; // High fraud risk

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine credit limit (30% of monthly revenue * score factor)
  let creditLimit = 0;
  let decision = 'REJECTED';
  const reasons = [];

  if (benford.isFraud && benford.fraudProbability > 40) {
    decision = 'REJECTED';
    reasons.push('High fraud probability detected');
    reasons.push(`Benford Score: ${benford.fraudProbability} (threshold: 40)`);
  } else if (score >= 70) {
    decision = 'APPROVED';
    creditLimit = Math.round(monthlyAvgRevenue * 0.30 * 1.5); // 45% of MAR
    reasons.push('Excellent credit profile');
  } else if (score >= 50) {
    decision = 'APPROVED';
    creditLimit = Math.round(monthlyAvgRevenue * 0.30); // 30% of MAR
    reasons.push('Good credit profile');
  } else if (score >= 30) {
    decision = 'REVIEW';
    creditLimit = Math.round(monthlyAvgRevenue * 0.15); // 15% of MAR
    reasons.push('Manual review required');
  } else {
    decision = 'REJECTED';
    reasons.push('Credit score too low');
  }

  return {
    score,
    decision,
    creditLimit,
    monthlyAvgRevenue: Math.round(monthlyAvgRevenue),
    avgOrderValue: Math.round(avgOrderValue),
    totalRevenue: Math.round(totalRevenue),
    orderCount: orders.length,
    riskLevel: benford.fraudProbability <= 20 ? 'LOW' : benford.fraudProbability <= 50 ? 'MEDIUM' : 'HIGH',
    reasons,
    benfordAnalysis: benford
  };
}

// =============================================
// WALLET POSITIONS (In-memory for demo)
// =============================================
const walletPositions = new Map();

function getWalletPosition(address) {
  if (!walletPositions.has(address)) {
    walletPositions.set(address, {
      address,
      creditLimit: 5000,
      borrowed: 0,
      available: 5000
    });
  }
  return walletPositions.get(address);
}

// Hàm tạo giá trị tuân theo Benford's Law (honest data)
function generateBenfordCompliantValue() {
  // Benford's Law: P(d) = log10(1 + 1/d)
  // First digit follows exact Benford distribution
  const benfordProbabilities = [0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046];
  
  const rand = Math.random();
  let cumulative = 0;
  let firstDigit = 1;
  
  for (let i = 0; i < 9; i++) {
    cumulative += benfordProbabilities[i];
    if (rand <= cumulative) {
      firstDigit = i + 1;
      break;
    }
  }
  
  // Generate 2-4 digit numbers with the chosen first digit
  // This ensures the first digit distribution is preserved
  const numDigits = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4 digits
  
  let value = firstDigit;
  for (let i = 1; i < numDigits; i++) {
    value = value * 10 + Math.floor(Math.random() * 10);
  }
  
  // Add cents for realism
  const cents = Math.floor(Math.random() * 100) / 100;
  return parseFloat((value + cents).toFixed(2));
}

// Hàm tạo giá trị wash trading (số tròn, lặp lại)
function generateWashTradingValue() {
  const suspiciousPatterns = [
    1000, 2000, 5000, 10000, 20000, 25000,
    9999, 19999, 29999,
    11111, 22222, 33333,
    15000, 18000, 12345
  ];
  return suspiciousPatterns[Math.floor(Math.random() * suspiciousPatterns.length)];
}

// 🆕 Hàm chuyển đổi orders sang CSV
function ordersToCSV(orders, profileType) {
  const headers = ['Order ID', 'Amount', 'Timestamp', 'Customer ID', 'Profile Type'];
  const rows = orders.map(order => [
    order.orderId,
    order.amount,
    order.timestamp,
    order.customerId,
    profileType
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
}

// Hàm tạo và lưu data khi server start
function generateAndSaveData() {
  const dataDir = path.join(__dirname, 'data');
  
  // Tạo folder data nếu chưa có
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  console.log('📝 Generating fresh mock data...');

  // 1️⃣ Tạo Honest Data (1000 orders)
  const honestOrders = [];
  for (let i = 0; i < 1000; i++) {
    const daysAgo = Math.floor(Math.random() * 365);
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - daysAgo);
    
    honestOrders.push({
      orderId: `ORD-${1000 + i}`,
      amount: generateBenfordCompliantValue(),
      timestamp: timestamp.toISOString(),
      customerId: `CUST-${Math.floor(Math.random() * 500)}`
    });
  }

  const honestData = {
    userId: 'honest-seller-001',
    profileType: 'honest',
    orders: honestOrders,
    totalRevenue: honestOrders.reduce((sum, o) => sum + o.amount, 0),
    orderCount: honestOrders.length,
    avgOrderValue: honestOrders.reduce((sum, o) => sum + o.amount, 0) / honestOrders.length,
    generatedAt: new Date().toISOString()
  };

  // 2️⃣ Tạo Fraud Data (100 orders)
  const fraudOrders = [];
  const limitedCustomers = [1, 2, 3, 4, 5, 6, 7, 8];
  
  for (let i = 0; i < 100; i++) {
    const daysAgo = Math.floor(Math.random() * 180);
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - daysAgo);
    
    fraudOrders.push({
      orderId: `ORD-${2000 + i}`,
      amount: generateWashTradingValue(),
      timestamp: timestamp.toISOString(),
      customerId: `CUST-${limitedCustomers[Math.floor(Math.random() * limitedCustomers.length)]}`
    });
  }

  const fraudData = {
    userId: 'fraud-seller-002',
    profileType: 'fraud',
    orders: fraudOrders,
    totalRevenue: fraudOrders.reduce((sum, o) => sum + o.amount, 0),
    orderCount: fraudOrders.length,
    avgOrderValue: fraudOrders.reduce((sum, o) => sum + o.amount, 0) / fraudOrders.length,
    generatedAt: new Date().toISOString()
  };

  // 3️⃣ Lưu JSON
  const honestJsonPath = path.join(dataDir, 'honest-data.json');
  const fraudJsonPath = path.join(dataDir, 'fraud-data.json');
  
  fs.writeFileSync(honestJsonPath, JSON.stringify(honestData, null, 2));
  fs.writeFileSync(fraudJsonPath, JSON.stringify(fraudData, null, 2));

  // 4️⃣ 🆕 Lưu CSV
  const honestCsvPath = path.join(dataDir, 'honest-data.csv');
  const fraudCsvPath = path.join(dataDir, 'fraud-data.csv');
  const combinedCsvPath = path.join(dataDir, 'all-orders.csv');
  
  fs.writeFileSync(honestCsvPath, ordersToCSV(honestOrders, 'honest'));
  fs.writeFileSync(fraudCsvPath, ordersToCSV(fraudOrders, 'fraud'));
  
  // CSV kết hợp cả 2 loại data
  const allOrders = [...honestOrders, ...fraudOrders];
  const combinedCSV = [
    'Order ID,Amount,Timestamp,Customer ID,Profile Type',
    ...honestOrders.map(o => `${o.orderId},${o.amount},${o.timestamp},${o.customerId},honest`),
    ...fraudOrders.map(o => `${o.orderId},${o.amount},${o.timestamp},${o.customerId},fraud`)
  ].join('\n');
  fs.writeFileSync(combinedCsvPath, combinedCSV);

  console.log('✅ Mock data saved:');
  console.log(`   📄 JSON: ${honestJsonPath}`);
  console.log(`   📄 JSON: ${fraudJsonPath}`);
  console.log(`   📊 CSV: ${honestCsvPath}`);
  console.log(`   📊 CSV: ${fraudCsvPath}`);
  console.log(`   📊 CSV (Combined): ${combinedCsvPath}`);
  
  return { honestData, fraudData };
}

// Tạo data khi server start
const mockData = generateAndSaveData();

// Endpoint: Honest Seller
app.get('/api/user/honest', (req, res) => {
  res.json(mockData.honestData);
});

// Endpoint: Fraud Seller
app.get('/api/user/fraud', (req, res) => {
  res.json(mockData.fraudData);
});

// 🆕 Endpoint: Download CSV
app.get('/api/download/csv/:type', (req, res) => {
  const { type } = req.params; // 'honest', 'fraud', or 'all'
  const dataDir = path.join(__dirname, 'data');
  
  let filename;
  if (type === 'honest') {
    filename = 'honest-data.csv';
  } else if (type === 'fraud') {
    filename = 'fraud-data.csv';
  } else if (type === 'all') {
    filename = 'all-orders.csv';
  } else {
    return res.status(400).json({ error: 'Invalid type' });
  }
  
  const filepath = path.join(dataDir, filename);
  res.download(filepath);
});

// Endpoint: Regenerate data
app.post('/api/regenerate', (req, res) => {
  const newData = generateAndSaveData();
  Object.assign(mockData, newData);
  res.json({ 
    message: 'Data regenerated successfully',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'StreamCredit Mock API is running',
    dataGenerated: mockData.honestData.generatedAt,
    version: '1.1.0',
    endpoints: [
      'GET  /api/user/honest',
      'GET  /api/user/fraud',
      'POST /api/analyze/benford',
      'POST /api/credit/evaluate',
      'GET  /api/credit/demo/:scenario',
      'GET  /api/wallet/:address',
      'POST /api/wallet/borrow',
      'POST /api/wallet/repay',
      'POST /api/wallet/update-credit',
      'POST /api/zk/generate-proof',
      'POST /api/zk/verify-proof'
    ]
  });
});

// =============================================
// BENFORD ANALYSIS ENDPOINTS
// =============================================

// Analyze transaction amounts with Benford's Law
app.post('/api/analyze/benford', (req, res) => {
  const { amounts, transactions } = req.body;
  
  // Accept either amounts array or transactions with amount field
  const amountList = amounts || (transactions && transactions.map(t => t.amount)) || [];
  
  if (!amountList || amountList.length < 10) {
    return res.status(400).json({ 
      error: 'At least 10 transaction amounts required',
      received: amountList ? amountList.length : 0
    });
  }

  const result = calculateBenfordScore(amountList);
  res.json({
    success: true,
    analysis: result,
    sampleSize: amountList.length,
    timestamp: new Date().toISOString()
  });
});

// Quick fraud check endpoint (compatible with demo.jsx)
app.post('/api/analyze/quick-check', (req, res) => {
  const { amounts } = req.body;
  
  if (!amounts || amounts.length < 10) {
    return res.status(400).json({ error: 'At least 10 amounts required' });
  }

  const result = calculateBenfordScore(amounts);
  res.json({
    isFraud: result.isFraud,
    score: result.fraudProbability,
    interpretation: result.interpretation,
    status: result.isFraud ? 'danger' : 'safe'
  });
});

// =============================================
// CREDIT SCORING ENDPOINTS
// =============================================

// Full credit evaluation
app.post('/api/credit/evaluate', (req, res) => {
  const { transactions, orders } = req.body;
  const orderList = transactions || orders;

  if (!orderList || orderList.length === 0) {
    return res.status(400).json({ error: 'Transaction data required' });
  }

  const result = calculateCreditScore(orderList);
  res.json({
    success: true,
    ...result,
    timestamp: new Date().toISOString()
  });
});

// Quick score from amounts only
app.post('/api/credit/quick-score', (req, res) => {
  const { amounts } = req.body;
  
  if (!amounts || amounts.length < 10) {
    return res.status(400).json({ error: 'At least 10 amounts required' });
  }

  // Convert to mock orders
  const orders = amounts.map((amount, i) => ({
    orderId: `ORD-${10000 + i}`,
    amount,
    timestamp: new Date().toISOString(),
    customerId: `CUST-${Math.floor(Math.random() * 1000)}`
  }));

  const result = calculateCreditScore(orders);
  res.json({
    success: true,
    ...result,
    timestamp: new Date().toISOString()
  });
});

// Demo endpoint - generates FRESH mock data each time and evaluates
app.get('/api/credit/demo/:scenario', (req, res) => {
  const { scenario } = req.params;
  const { fresh } = req.query; // Add ?fresh=true to force new data
  const isHonest = scenario.toUpperCase() === 'HONEST';

  let orders;
  
  // Generate fresh data each time for demo variety
  if (isHonest) {
    // Generate 500-1000 honest orders
    const orderCount = 500 + Math.floor(Math.random() * 500);
    orders = [];
    for (let i = 0; i < orderCount; i++) {
      const daysAgo = Math.floor(Math.random() * 365);
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - daysAgo);
      
      orders.push({
        orderId: `ORD-H-${Date.now()}-${i}`,
        amount: generateBenfordCompliantValue(),
        timestamp: timestamp.toISOString(),
        customerId: `CUST-${Math.floor(Math.random() * 300)}`
      });
    }
  } else {
    // Generate 50-150 fraudulent orders
    const orderCount = 50 + Math.floor(Math.random() * 100);
    orders = [];
    const limitedCustomers = [1, 2, 3, 4, 5]; // Wash trading uses few accounts
    
    for (let i = 0; i < orderCount; i++) {
      const daysAgo = Math.floor(Math.random() * 90);
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - daysAgo);
      
      orders.push({
        orderId: `ORD-F-${Date.now()}-${i}`,
        amount: generateWashTradingValue(),
        timestamp: timestamp.toISOString(),
        customerId: `CUST-${limitedCustomers[Math.floor(Math.random() * limitedCustomers.length)]}`
      });
    }
  }

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
  const result = calculateCreditScore(orders);

  res.json({
    success: true,
    scenario: scenario.toUpperCase(),
    scenarioDescription: isHonest 
      ? 'Healthy retail business following natural Benford patterns' 
      : 'Suspicious wash trading with round numbers and repetitive patterns',
    revenue: `$${Math.round(totalRevenue).toLocaleString()}`,
    rawRevenue: Math.round(totalRevenue),
    orderCount: orders.length,
    ...result,
    timestamp: new Date().toISOString()
  });
});

// =============================================
// WALLET POSITION ENDPOINTS
// =============================================

// Get wallet position
app.get('/api/wallet/:address', (req, res) => {
  const { address } = req.params;
  const position = getWalletPosition(address);
  res.json({
    success: true,
    position
  });
});

// Borrow against credit
app.post('/api/wallet/borrow', (req, res) => {
  const { address, amount } = req.body;

  if (!address || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid address and amount required' });
  }

  const position = getWalletPosition(address);

  if (amount > position.available) {
    return res.status(400).json({ 
      error: 'Insufficient credit available',
      available: position.available,
      requested: amount
    });
  }

  position.borrowed += amount;
  position.available = position.creditLimit - position.borrowed;

  res.json({
    success: true,
    txHash: `0x${crypto.randomBytes(32).toString('hex')}`,
    message: `Borrowed $${amount.toLocaleString()} successfully`,
    position
  });
});

// Repay borrowed amount
app.post('/api/wallet/repay', (req, res) => {
  const { address, amount } = req.body;

  if (!address || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid address and amount required' });
  }

  const position = getWalletPosition(address);

  if (amount > position.borrowed) {
    return res.status(400).json({ 
      error: 'Repay amount exceeds debt',
      borrowed: position.borrowed,
      requested: amount
    });
  }

  position.borrowed -= amount;
  position.available = position.creditLimit - position.borrowed;

  res.json({
    success: true,
    txHash: `0x${crypto.randomBytes(32).toString('hex')}`,
    message: `Repaid $${amount.toLocaleString()} successfully`,
    position
  });
});

// Update credit limit (after ZK verification)
app.post('/api/wallet/update-credit', (req, res) => {
  const { address, newLimit, increase } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address required' });
  }

  const position = getWalletPosition(address);
  const oldLimit = position.creditLimit;

  if (newLimit !== undefined) {
    position.creditLimit = newLimit;
  } else if (increase !== undefined) {
    position.creditLimit += increase;
  }

  position.available = position.creditLimit - position.borrowed;

  res.json({
    success: true,
    txHash: `0x${crypto.randomBytes(32).toString('hex')}`,
    message: `Credit limit updated from $${oldLimit.toLocaleString()} to $${position.creditLimit.toLocaleString()}`,
    position,
    oldLimit,
    newLimit: position.creditLimit
  });
});

// =============================================
// ZK PROOF ENDPOINTS (Mock for Demo)
// =============================================

// Generate ZK proof
app.post('/api/zk/generate-proof', async (req, res) => {
  const { amounts, transactions, revenueThreshold = 10000, benfordThreshold = 50 } = req.body;
  
  const amountList = amounts || (transactions && transactions.map(t => t.amount)) || [];

  if (!amountList || amountList.length < 10) {
    return res.status(400).json({ error: 'At least 10 amounts required for proof generation' });
  }

  const startTime = Date.now();

  // Analyze data
  const benford = calculateBenfordScore(amountList);
  const totalRevenue = amountList.reduce((sum, a) => sum + a, 0);

  // Check constraints
  const revenueOk = totalRevenue >= revenueThreshold;
  const benfordOk = benford.fraudProbability <= benfordThreshold;

  // Simulate proof generation delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  if (!revenueOk) {
    return res.json({
      success: false,
      error: `Revenue constraint failed: $${Math.round(totalRevenue).toLocaleString()} < $${revenueThreshold.toLocaleString()}`,
      generationTimeMs: Date.now() - startTime
    });
  }

  if (!benfordOk) {
    return res.json({
      success: false,
      error: `Benford constraint failed: ${benford.fraudProbability}% > ${benfordThreshold}%`,
      generationTimeMs: Date.now() - startTime
    });
  }

  // Generate mock Groth16 proof
  const proofHash = crypto.createHash('sha256')
    .update(`${totalRevenue}${benford.score}${Date.now()}`)
    .digest('hex');

  const mockProof = {
    pi_a: [`0x${proofHash.slice(0, 64)}`, `0x${proofHash.slice(32)}0000`],
    pi_b: [
      [`0x${crypto.randomBytes(32).toString('hex')}`, `0x${crypto.randomBytes(32).toString('hex')}`],
      [`0x${crypto.randomBytes(32).toString('hex')}`, `0x${crypto.randomBytes(32).toString('hex')}`]
    ],
    pi_c: [`0x${crypto.randomBytes(32).toString('hex')}`, `0x${crypto.randomBytes(32).toString('hex')}`],
    protocol: 'groth16',
    curve: 'bn128'
  };

  const publicInputs = {
    revenueThreshold,
    benfordThreshold,
    revenueHash: crypto.createHash('sha256').update(totalRevenue.toString()).digest('hex').slice(0, 16),
    isValid: 1,
    timestamp: Math.floor(Date.now() / 1000)
  };

  res.json({
    success: true,
    proof: mockProof,
    publicInputs,
    analysis: {
      totalRevenue: Math.round(totalRevenue),
      benfordScore: benford.fraudProbability,
      orderCount: amountList.length
    },
    generationTimeMs: Date.now() - startTime
  });
});

// Verify ZK proof
app.post('/api/zk/verify-proof', (req, res) => {
  const { proof, publicInputs } = req.body;

  // Mock verification
  const isValid = proof && proof.pi_a && proof.pi_b && proof.pi_c;

  res.json({
    valid: isValid,
    verifiedAt: Math.floor(Date.now() / 1000),
    txHash: isValid ? `0x${crypto.createHash('sha256').update(JSON.stringify(proof)).digest('hex')}` : null,
    message: isValid ? 'Proof verified successfully' : 'Invalid proof structure'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 StreamCredit Mock API v1.1.0 running on http://localhost:${PORT}`);
  console.log('');
  console.log('📊 Data Endpoints:');
  console.log(`   GET  http://localhost:${PORT}/api/user/honest`);
  console.log(`   GET  http://localhost:${PORT}/api/user/fraud`);
  console.log('');
  console.log('🔍 Analysis Endpoints:');
  console.log(`   POST http://localhost:${PORT}/api/analyze/benford`);
  console.log(`   POST http://localhost:${PORT}/api/analyze/quick-check`);
  console.log('');
  console.log('💳 Credit Endpoints:');
  console.log(`   POST http://localhost:${PORT}/api/credit/evaluate`);
  console.log(`   POST http://localhost:${PORT}/api/credit/quick-score`);
  console.log(`   GET  http://localhost:${PORT}/api/credit/demo/HONEST`);
  console.log(`   GET  http://localhost:${PORT}/api/credit/demo/FRAUD`);
  console.log('');
  console.log('👛 Wallet Endpoints:');
  console.log(`   GET  http://localhost:${PORT}/api/wallet/:address`);
  console.log(`   POST http://localhost:${PORT}/api/wallet/borrow`);
  console.log(`   POST http://localhost:${PORT}/api/wallet/repay`);
  console.log(`   POST http://localhost:${PORT}/api/wallet/update-credit`);
  console.log('');
  console.log('🔐 ZK Proof Endpoints:');
  console.log(`   POST http://localhost:${PORT}/api/zk/generate-proof`);
  console.log(`   POST http://localhost:${PORT}/api/zk/verify-proof`);
  console.log('');
  console.log('📥 Download Endpoints:');
  console.log(`   GET  http://localhost:${PORT}/api/download/csv/all`);
  console.log(`   POST http://localhost:${PORT}/api/regenerate`);
});

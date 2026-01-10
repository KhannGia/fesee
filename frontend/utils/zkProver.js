/**
 * ZK Proof Generator for Browser
 * Uses snarkjs to generate Groth16 proofs client-side
 */

// Import snarkjs (will be loaded from CDN in browser)
// Add to _app.js: <script src="https://cdn.jsdelivr.net/npm/snarkjs@0.7.0/build/snarkjs.min.js"></script>

/**
 * Wait for snarkjs to be loaded
 */
async function waitForSnarkjs(maxWaitMs = 10000) {
  const startTime = Date.now();
  while (typeof window.snarkjs === 'undefined') {
    if (Date.now() - startTime > maxWaitMs) {
      throw new Error('snarkjs not loaded. Please refresh the page.');
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return window.snarkjs;
}

/**
 * Calculate Benford score from order amounts
 */
function calculateBenfordScore(orderAmounts) {
  const digitCounts = new Array(9).fill(0);
  let total = 0;

  // Count first digits
  orderAmounts.forEach(amount => {
    const amountStr = Math.floor(amount).toString();
    const firstDigit = parseInt(amountStr[0]);
    if (firstDigit >= 1 && firstDigit <= 9) {
      digitCounts[firstDigit - 1]++;
      total++;
    }
  });

  if (total === 0) return 0;

  // Benford's Law expected probabilities
  const expectedProbs = [0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046];

  // Calculate chi-square statistic
  let chiSquare = 0;
  for (let i = 0; i < 9; i++) {
    const observed = digitCounts[i];
    const expected = expectedProbs[i] * total;
    if (expected > 0) {
      chiSquare += Math.pow(observed - expected, 2) / expected;
    }
  }

  // Return chi-square score (rounded to integer for circuit)
  return Math.round(chiSquare);
}

/**
 * Generate ZK proof from order data
 * @param {Array<number>} orderAmounts - Array of 100 order amounts
 * @param {number} revenueThreshold - Minimum revenue required (e.g., 500000)
 * @param {number} benfordThreshold - Maximum allowed Benford score (e.g., 20)
 * @returns {Promise<{proof, publicSignals}>}
 */
export async function generateProof(orderAmounts, revenueThreshold = 500000, benfordThreshold = 50) {
  try {
    console.log('🔐 Starting ZK proof generation...');
    console.log('Orders count:', orderAmounts.length);
    
    // Convert to integers (multiply by 100 to preserve 2 decimal places, then floor)
    // e.g., 1031.45 -> 103145
    const integerAmounts = orderAmounts.map(amt => Math.floor(amt * 100));
    console.log('✅ Converted to integers (x100):', integerAmounts.slice(0, 5), '...');
    
    // Ensure exactly 100 orders (pad with zeros if needed)
    const paddedOrders = [...integerAmounts];
    while (paddedOrders.length < 100) {
      paddedOrders.push(0);
    }
    if (paddedOrders.length > 100) {
      paddedOrders.length = 100; // Truncate if more than 100
    }

    // Calculate Benford score (use original amounts for accurate calculation)
    const benfordScore = calculateBenfordScore(orderAmounts);
    console.log('📊 Benford Score:', benfordScore);

    // Calculate total revenue (also convert to integer, scaled by 100)
    const totalRevenue = Math.floor(orderAmounts.reduce((sum, amt) => sum + amt, 0) * 100);
    console.log('💰 Total Revenue (x100):', totalRevenue);

    // Adjust thresholds to match scaling
    const scaledRevenueThreshold = Math.floor(revenueThreshold * 100);

    // Prepare circuit inputs
    const input = {
      orderAmounts: paddedOrders,
      benfordScore: benfordScore,
      revenueThreshold: scaledRevenueThreshold,
      benfordThreshold: benfordThreshold
    };

    console.log('⚙️ Generating proof with snarkjs...');
    
    // Wait for snarkjs to be loaded
    console.log('⏳ Waiting for snarkjs to load...');
    const snarkjs = await waitForSnarkjs();
    console.log('✅ snarkjs is ready!');

    // Generate proof using WASM and zkey files from /public/zk/
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      '/zk/creditCheck.wasm?v=' + Date.now(),
      '/zk/creditCheck_final.zkey?v=' + Date.now()
    );

    console.log('✅ Proof generated successfully!');
    console.log('📊 Public signals:', publicSignals);
    console.log('🔍 CORRECTED MAPPING (circuit outputs in different order):');
    console.log('  - [0] isValid:', publicSignals[0], '(type:', typeof publicSignals[0], ')');
    console.log('  - [1] revenueThreshold:', publicSignals[1], '(type:', typeof publicSignals[1], ')');
    console.log('  - [2] benfordThreshold:', publicSignals[2], '(type:', typeof publicSignals[2], ')');
    console.log('🔍 isValid value comparison:');
    console.log('  - publicSignals[0] === "1":', publicSignals[0] === "1");
    console.log('  - publicSignals[0] === 1:', publicSignals[0] === 1);
    console.log('  - publicSignals[0] == 1:', publicSignals[0] == 1);

    return { proof, publicSignals };
  } catch (error) {
    console.error('❌ Proof generation failed:', error);
    throw error;
  }
}

/**
 * Format proof for Solidity contract call
 * Groth16 proof structure: [pi_a, pi_b, pi_c]
 */
export function formatProofForSolidity(proof, publicSignals) {
  // Convert string public signals to BigInt for Solidity
  const inputBigInt = publicSignals.map(s => BigInt(s));
  
  // Convert proof to format expected by Solidity verifier
  const proofFormatted = {
    a: [proof.pi_a[0], proof.pi_a[1]],
    b: [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]]
    ],
    c: [proof.pi_c[0], proof.pi_c[1]],
    input: inputBigInt
  };

  return proofFormatted;
}

/**
 * Verify proof locally before sending to blockchain
 */
export async function verifyProofLocally(proof, publicSignals) {
  try {
    console.log('🔍 Verifying proof locally...');
    console.log('📋 Received publicSignals:', publicSignals);
    
    // Wait for snarkjs to be loaded
    const snarkjs = await waitForSnarkjs();
    
    const vkey = await fetch('/zk/verification_key.json').then(r => r.json());
    const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    
    console.log('🔐 Cryptographic verification result:', isValid ? '✅ Valid' : '❌ Invalid');
    console.log('📊 Business logic check (publicSignals[2]):', publicSignals[2]);
    console.log('  - Expected: "1" or 1 (means valid)');
    console.log('  - Actual value:', publicSignals[2]);
    console.log('  - Actual type:', typeof publicSignals[2]);
    
    return isValid;
  } catch (error) {
    console.error('❌ Local verification failed:', error);
    return false;
  }
}

/**
 * Complete flow: Fetch orders → Generate proof → Verify locally
 */
export async function generateProofFromAPI(apiUrl, revenueThreshold = 500000, benfordThreshold = 20) {
  try {
    console.log('📡 Fetching order data from API...');
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    const orderAmounts = data.orders.map(order => parseFloat(order.amount));
    console.log('Fetched', orderAmounts.length, 'orders');

    // Generate proof
    const { proof, publicSignals } = await generateProof(orderAmounts, revenueThreshold, benfordThreshold);

    // Verify locally
    const isValid = await verifyProofLocally(proof, publicSignals);
    if (!isValid) {
      throw new Error('Proof verification failed locally');
    }

    // Format for Solidity
    const formattedProof = formatProofForSolidity(proof, publicSignals);

    return {
      proof: formattedProof,
      publicSignals,
      orderCount: orderAmounts.length,
      totalRevenue: orderAmounts.reduce((sum, amt) => sum + amt, 0),
      benfordScore: calculateBenfordScore(orderAmounts)
    };
  } catch (error) {
    console.error('❌ Full proof generation flow failed:', error);
    throw error;
  }
}

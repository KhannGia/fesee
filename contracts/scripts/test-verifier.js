// Test script to check MockVerifier
const { ethers } = require('hardhat');

async function main() {
  const mockVerifierAddress = '0x1E2905cCc01D83DF8074BdBa8a8bf839B69e6fE3';
  
  const mockVerifier = await ethers.getContractAt('MockVerifier', mockVerifierAddress);
  
  console.log('Testing MockVerifier at:', mockVerifierAddress);
  
  // Check alwaysPass value
  const alwaysPass = await mockVerifier.alwaysPass();
  console.log('alwaysPass:', alwaysPass);
  
  // Test verifyProof with dummy data
  const a = [1, 2];
  const b = [[1, 2], [3, 4]];
  const c = [1, 2];
  const input = [1];
  
  try {
    const result = await mockVerifier.verifyProof(a, b, c, input);
    console.log('verifyProof result:', result);
  } catch (err) {
    console.error('verifyProof failed:', err.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

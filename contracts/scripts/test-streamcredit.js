// Test script to check StreamCredit
const { ethers } = require('hardhat');

async function main() {
  const streamCreditAddress = '0xD56e705D58F597B448610c17Da11598539917910';
  
  const streamCredit = await ethers.getContractAt('StreamCredit', streamCreditAddress);
  
  console.log('Testing StreamCredit at:', streamCreditAddress);
  
  // Check verifier address
  const verifierAddr = await streamCredit.verifier();
  console.log('Verifier address:', verifierAddr);
  
  // Test verifyAndUpdateCredit with dummy data
  const a = [1, 2];
  const b = [[1, 2], [3, 4]];
  const c = [1, 2];
  const input = [1];
  const revenue = ethers.parseUnits('100000', 6); // 100k USDC
  
  console.log('\nTesting verifyAndUpdateCredit...');
  console.log('Input:', input);
  console.log('Revenue:', revenue.toString());
  
  try {
    // Try static call first
    await streamCredit.verifyAndUpdateCredit.staticCall(a, b, c, input, revenue);
    console.log('✅ Static call succeeded');
    
    // Now send actual transaction
    const tx = await streamCredit.verifyAndUpdateCredit(a, b, c, input, revenue);
    console.log('Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    if (err.data) {
      console.error('Error data:', err.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

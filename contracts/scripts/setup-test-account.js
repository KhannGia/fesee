// Quick setup script for testing without ZK proofs
// Run: npx hardhat run scripts/setup-test-account.js --network sepolia

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("🔧 Setting up test account:", deployer.address);
  
  // Contract addresses from latest deployment
  const STREAM_CREDIT = "0xe635F54f37C8ba9e54ad184E5F7B496Ff63fE66F";
  const MOCK_USDC = "0xf14869F241054c73DFce2C93cC5ed75b12395b06";
  
  // Get contracts
  const mockUSDC = await hre.ethers.getContractAt("MockUSDC", MOCK_USDC);
  const streamCredit = await hre.ethers.getContractAt("StreamCredit", STREAM_CREDIT);
  
  console.log("\n1️⃣ Minting test USDC...");
  const mintAmount = hre.ethers.parseUnits("100000", 6); // 100,000 USDC
  const mintTx = await mockUSDC.mint(deployer.address, mintAmount);
  await mintTx.wait();
  console.log("✅ Minted 100,000 USDC to your wallet");
  
  // Check current balance
  const balance = await mockUSDC.balanceOf(deployer.address);
  console.log(`💰 Your USDC balance: ${hre.ethers.formatUnits(balance, 6)} USDC`);
  
  console.log("\n2️⃣ Setting up credit limit (simulating ZK proof)...");
  
  // Prepare mock ZK proof (MockVerifier accepts any values)
  const a = [1n, 2n];
  const b = [[1n, 2n], [3n, 4n]];
  const c = [1n, 2n];
  const input = [1n]; // isValid = 1 (true)
  const revenue = hre.ethers.parseUnits("50000", 6); // $50,000 revenue
  
  const proofTx = await streamCredit.verifyAndUpdateCredit(a, b, c, input, revenue);
  await proofTx.wait();
  
  const creditLimit = await streamCredit.creditLimit(deployer.address);
  console.log(`✅ Credit limit set: ${hre.ethers.formatUnits(creditLimit, 6)} USDC`);
  console.log(`   (30% of $50,000 revenue = $15,000)`);
  
  console.log("\n3️⃣ Approving USDC for contract...");
  const approveTx = await mockUSDC.approve(STREAM_CREDIT, hre.ethers.parseUnits("100000", 6));
  await approveTx.wait();
  console.log("✅ USDC approved for StreamCredit contract");
  
  console.log("\n4️⃣ Adding liquidity to protocol...");
  const liquidityAmount = hre.ethers.parseUnits("50000", 6); // 50,000 USDC
  const liquidityTx = await streamCredit.addLiquidity(liquidityAmount);
  await liquidityTx.wait();
  console.log("✅ Added 50,000 USDC liquidity");
  
  const totalLiquidity = await streamCredit.totalLiquidity();
  console.log(`💧 Total protocol liquidity: ${hre.ethers.formatUnits(totalLiquidity, 6)} USDC`);
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ SETUP COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Your Account Summary:");
  console.log(`   Wallet: ${deployer.address}`);
  console.log(`   USDC Balance: ${hre.ethers.formatUnits(balance.sub(liquidityAmount), 6)} USDC`);
  console.log(`   Credit Limit: ${hre.ethers.formatUnits(creditLimit, 6)} USDC`);
  console.log(`   Available to Borrow: ${hre.ethers.formatUnits(creditLimit, 6)} USDC`);
  
  console.log("\n🎮 You can now:");
  console.log("   1. Go to 'Manage Loans' in the frontend");
  console.log("   2. Select loan term (7-365 days)");
  console.log("   3. Borrow up to $15,000 USDC");
  console.log("   4. Test repayment with early bonus");
  console.log("   5. Pay commitment fees");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

const hre = require("hardhat");

async function main() {
  console.log("🔄 Redeploying MockUSDC with unlimited faucet...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);

  // Deploy new MockUSDC
  console.log("\n🚀 Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("✅ MockUSDC deployed to:", mockUSDCAddress);
  
  // Redeploy StreamCredit with new MockUSDC
  const mockVerifier = "0x1E2905cCc01D83DF8074BdBa8a8bf839B69e6fE3";
  
  console.log("\n🚀 Deploying StreamCredit with new MockUSDC...");
  const StreamCredit = await hre.ethers.getContractFactory("StreamCredit");
  const streamCredit = await StreamCredit.deploy(mockVerifier, mockUSDCAddress);
  await streamCredit.waitForDeployment();
  const streamCreditAddress = await streamCredit.getAddress();
  console.log("✅ StreamCredit deployed to:", streamCreditAddress);
  
  console.log("\n📝 Update frontend/config/constants.js:");
  console.log(`streamCredit: '${streamCreditAddress}'`);
  console.log(`mockUSDC: '${mockUSDCAddress}'`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

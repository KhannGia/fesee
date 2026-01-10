const { ethers } = require("hardhat");
const fs = require("fs");

/**
 * Deploy Collateral NFT System
 * Order: MockUSDC → MockVerifier → StreamCredit → CollateralNFT
 */
async function main() {
  console.log("🚀 Starting Collateral NFT Deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy MockUSDC
  console.log("📝 Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("✅ MockUSDC deployed to:", usdcAddress);

  // Deploy MockVerifier
  console.log("\n📝 Deploying MockVerifier...");
  const MockVerifier = await ethers.getContractFactory("MockVerifier");
  const verifier = await MockVerifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("✅ MockVerifier deployed to:", verifierAddress);

  // Deploy StreamCredit
  console.log("\n📝 Deploying StreamCredit...");
  const StreamCredit = await ethers.getContractFactory("StreamCredit");
  const streamCredit = await StreamCredit.deploy(usdcAddress, verifierAddress);
  await streamCredit.waitForDeployment();
  const streamCreditAddress = await streamCredit.getAddress();
  console.log("✅ StreamCredit deployed to:", streamCreditAddress);

  // Deploy CollateralNFT
  console.log("\n📝 Deploying CollateralNFT...");
  const CollateralNFT = await ethers.getContractFactory("CollateralNFT");
  const collateralNFT = await CollateralNFT.deploy();
  await collateralNFT.waitForDeployment();
  const collateralNFTAddress = await collateralNFT.getAddress();
  console.log("✅ CollateralNFT deployed to:", collateralNFTAddress);

  // Setup: Authorize StreamCredit to lock/unlock collateral
  console.log("\n⚙️  Setting up CollateralNFT authorization...");
  const authTx = await collateralNFT.authorizeContract(streamCreditAddress, true);
  await authTx.wait();
  console.log("✅ StreamCredit authorized to lock/unlock collateral");

  // Setup: Set CollateralNFT address in StreamCredit (if needed in future)
  // Note: StreamCredit doesn't have this function yet, will add in integration
  console.log("\n✅ Deployment complete!\n");

  // Save addresses
  const addresses = {
    network: "sepolia",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      MockUSDC: usdcAddress,
      MockVerifier: verifierAddress,
      StreamCredit: streamCreditAddress,
      CollateralNFT: collateralNFTAddress
    }
  };

  const outputPath = "./deployed-addresses-collateral.json";
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log("📄 Addresses saved to:", outputPath);

  // Display summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("MockUSDC:        ", usdcAddress);
  console.log("MockVerifier:    ", verifierAddress);
  console.log("StreamCredit:    ", streamCreditAddress);
  console.log("CollateralNFT:   ", collateralNFTAddress);
  console.log("=".repeat(60));
  
  console.log("\n📋 Next steps:");
  console.log("1. Update frontend/config/constants.js with new addresses");
  console.log("2. Add CollateralNFT ABI to frontend/config/abi.js");
  console.log("3. Update Web3Context.js to load CollateralNFT contract");
  console.log("4. Integrate CollateralManager component into app");
  console.log("5. Set NEXT_PUBLIC_NFT_STORAGE_KEY in .env file");
  console.log("\n🎉 Ready to tokenize collateral!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

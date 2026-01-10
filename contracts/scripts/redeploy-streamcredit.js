const hre = require("hardhat");

async function main() {
  console.log("🔄 Redeploying StreamCredit with correct MockVerifier address...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  
  // Existing addresses
  const mockUSDC = "0xF2349DF62365B214b5a8BD654D9CD8f47fe26009";
  const mockVerifier = "0x1E2905cCc01D83DF8074BdBa8a8bf839B69e6fE3";
  
  console.log("MockUSDC:", mockUSDC);
  console.log("MockVerifier:", mockVerifier);

  // Deploy StreamCredit with CORRECT verifier
  console.log("\n🚀 Deploying StreamCredit...");
  const StreamCredit = await hre.ethers.getContractFactory("StreamCredit");
  const streamCredit = await StreamCredit.deploy(mockVerifier, mockUSDC);
  await streamCredit.waitForDeployment();
  const streamCreditAddress = await streamCredit.getAddress();
  console.log("✅ StreamCredit deployed to:", streamCreditAddress);
  
  // Verify verifier address
  const verifierAddr = await streamCredit.verifier();
  console.log("\n✅ Verification:");
  console.log("Verifier in contract:", verifierAddr);
  console.log("Expected verifier:  ", mockVerifier);
  console.log("Match:", verifierAddr === mockVerifier ? "✅" : "❌");
  
  console.log("\n📝 Update frontend/config/constants.js:");
  console.log(`streamCredit: '${streamCreditAddress}'`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

const { ethers } = require("hardhat");

/**
 * Authorize StreamCredit to lock/unlock collateral
 */
async function main() {
  const collateralNFTAddress = "0x4aF23f3B0b8e8886f705b833989501a37662Feba";
  const streamCreditAddress = "0x6Ec0f129539873c8FBfcCcf02175b56a26e43C15";

  console.log("⚙️  Authorizing StreamCredit to lock/unlock collateral...");
  
  const CollateralNFT = await ethers.getContractFactory("CollateralNFT");
  const collateralNFT = CollateralNFT.attach(collateralNFTAddress);
  
  const tx = await collateralNFT.authorizeContract(streamCreditAddress, true);
  await tx.wait();
  
  console.log("✅ StreamCredit authorized!");
  
  // Verify
  const isAuthorized = await collateralNFT.authorizedContracts(streamCreditAddress);
  console.log("Verification:", isAuthorized ? "✅ Authorized" : "❌ Not authorized");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

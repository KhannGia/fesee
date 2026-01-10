/**
 * Script to check account state on StreamCredit contract
 * Usage: node scripts/check-account-state.js <YOUR_ADDRESS>
 */

const hre = require("hardhat");

async function main() {
  const accountAddress = process.argv[2];
  
  if (!accountAddress) {
    console.error("❌ Error: Please provide account address");
    console.error("Usage: node scripts/check-account-state.js 0x...");
    process.exit(1);
  }

  console.log("🔍 Checking account state on StreamCredit contract...\n");

  // Read deployed addresses
  const fs = require('fs');
  const deployed = JSON.parse(fs.readFileSync('deployed-addresses-mock.json', 'utf8'));
  
  console.log("📍 Contract: ", deployed.streamCredit);
  console.log("👤 Account:  ", accountAddress);
  console.log();

  // Get contract
  const StreamCredit = await hre.ethers.getContractFactory("StreamCredit");
  const contract = StreamCredit.attach(deployed.streamCredit);

  // Get account info
  const info = await contract.getAccountInfo(accountAddress);
  
  console.log("=" .repeat(60));
  console.log("📊 ACCOUNT STATE");
  console.log("=".repeat(60));
  console.log("Credit Limit:          ", hre.ethers.formatUnits(info._creditLimit, 6), "USDC");
  console.log("Borrowed (Principal):  ", hre.ethers.formatUnits(info._borrowed, 6), "USDC");
  console.log("Available Credit:      ", hre.ethers.formatUnits(info._available, 6), "USDC");
  console.log("Interest Accrued:      ", hre.ethers.formatUnits(info._interest, 6), "USDC");
  console.log("Commitment Fee:        ", hre.ethers.formatUnits(info._commitmentFee, 6), "USDC");
  console.log("Loan Term:             ", info._term.toString(), "days");
  console.log("Interest Rate:         ", (Number(info._interestRate) / 100).toString(), "%");
  console.log("Early Repayment:       ", info._isEarly ? "✅ YES (2% bonus)" : "❌ NO");
  console.log();
  
  console.log("=" .repeat(60));
  console.log("⏰ COOLDOWN & EXPIRATION");
  console.log("=".repeat(60));
  
  // Last full repayment
  if (info._lastFullRepayment > 0) {
    const lastRepayDate = new Date(Number(info._lastFullRepayment) * 1000);
    const canBorrowDate = new Date((Number(info._lastFullRepayment) + 5 * 24 * 60 * 60) * 1000);
    console.log("Last Full Repayment:   ", lastRepayDate.toLocaleString());
    console.log("Can Borrow Again:      ", canBorrowDate.toLocaleString());
  } else {
    console.log("Last Full Repayment:    Never (or first time)");
  }
  
  // Credit limit expiration
  if (info._creditLimitExpiration > 0) {
    const expirationDate = new Date(Number(info._creditLimitExpiration) * 1000);
    console.log("Credit Limit Expiration:", expirationDate.toLocaleString());
    console.log("Days Until Expiration:  ", info._daysUntilExpiration.toString(), "days");
  } else {
    console.log("Credit Limit Expiration: Not set");
  }
  
  console.log();
  console.log("Can Borrow Now?         ", info._canBorrow ? "✅ YES" : "❌ NO");
  console.log("=".repeat(60));
  
  // Diagnosis
  console.log();
  console.log("🔧 DIAGNOSIS:");
  
  if (Number(info._borrowed) > 0) {
    console.log("❌ You have an active loan with principal:", hre.ethers.formatUnits(info._borrowed, 6), "USDC");
    console.log("   → You must repay this loan before borrowing again");
    
    const totalDebt = Number(info._borrowed) + Number(info._interest);
    console.log("   → Total debt to repay:", hre.ethers.formatUnits(totalDebt, 6), "USDC");
  } else if (info._lastFullRepayment > 0 && !info._canBorrow) {
    const now = Math.floor(Date.now() / 1000);
    const cooldownEnd = Number(info._lastFullRepayment) + 5 * 24 * 60 * 60;
    const remainingSeconds = cooldownEnd - now;
    const remainingHours = Math.floor(remainingSeconds / 3600);
    const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);
    
    console.log("⏳ You are in cooldown period");
    console.log("   → Time remaining:", remainingHours, "hours", remainingMinutes, "minutes");
  } else if (info._creditLimitExpiration > 0 && info._daysUntilExpiration === 0n) {
    console.log("⚠️  Your credit limit has expired");
    console.log("   → Please submit a new ZK proof to renew");
  } else if (info._canBorrow) {
    console.log("✅ You can borrow now!");
    console.log("   → Available credit:", hre.ethers.formatUnits(info._available, 6), "USDC");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

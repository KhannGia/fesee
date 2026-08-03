const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Regenerates `frontend/config/abi.js` from the compiled artifacts.
 *
 * The frontend ABI used to be maintained by hand, which let it drift out of
 * sync with the contracts (calls were built against a signature the contract
 * no longer had). Run this after every contract change:
 *
 *   npx hardhat run scripts/export-abi.js
 */
const EXPORTS = [
  { contract: "StreamCredit", name: "STREAM_CREDIT_ABI" },
  { contract: "MockUSDC", name: "MOCK_USDC_ABI" },
  { contract: "CollateralNFT", name: "COLLATERAL_NFT_ABI" },
];

async function main() {
  await hre.run("compile");

  const chunks = [
    "// AUTO-GENERATED — do not edit by hand.",
    "// Regenerate with: cd contracts && npx hardhat run scripts/export-abi.js",
    "",
  ];

  for (const { contract, name } of EXPORTS) {
    const { abi } = await hre.artifacts.readArtifact(contract);
    chunks.push(`export const ${name} = ${JSON.stringify(abi, null, 2)};`);
    chunks.push("");
    console.log(`${name.padEnd(22)} ${abi.length} entries from ${contract}`);
  }

  const outPath = path.join(__dirname, "..", "..", "frontend", "config", "abi.js");
  fs.writeFileSync(outPath, chunks.join("\n"));

  console.log(`\nWritten to ${outPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
